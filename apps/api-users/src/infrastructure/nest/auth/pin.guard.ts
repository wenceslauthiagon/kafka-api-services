import { Mutex } from 'redis-semaphore';
import { Logger } from 'winston';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Milliseconds } from 'cache-manager';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import {
  BcryptHashService,
  InjectLogger,
  InjectValidator,
  NotImplementedException,
  NullPointerException,
  ProtocolType,
  RedisService,
  Validator,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';

interface PinConfig {
  APP_PIN_MAX_ATTEMPTS: number;
  APP_PIN_MAX_ATTEMPTS_TTL: number;
  APP_PIN_MAX_BAN_TIMEOUT_MINUTES: number;
  APP_PIN_MIN_BAN_TIMEOUT_MINUTES: number;
}

/**
 * Pin request body. This class can be extended to provide PIN swagger and
 * validator to a controller request body.
 */
export class PinBody {
  @ApiProperty({
    description: 'User Pin.',
    example: '1234',
  })
  @IsString()
  @Length(4, 4)
  pin: string;

  constructor(props: PinBody) {
    Object.assign(this, props);
  }
}

type Attempt = {
  timestamp: number;
};

export class PinAttempts {
  /*
   * Number of attempts to validate pin before kicking user out.
   */
  static pinMaxAttempts: number;

  /**
   * TTl to remember number of attempts to validate pin before kicking user out.
   */
  static pinMaxAttemptsTtl: Milliseconds;

  /**
   * Max number of minutes to ban a user.
   */
  static pinMaxBanTimeoutMinutes: number;

  /**
   * Min number of minutes to ban a user.
   */
  static pinMinBanTimeoutMinutes: number;

  /**
   * List of attempts
   */
  private attempts: Attempt[] = [];

  /**
   * Ban until timestamp.
   */
  private banTime: number = 0;

  constructor(props?: PinAttempts) {
    Object.assign(this, props);
  }

  /**
   *
   * @param attempt New attempt
   */
  addAttempt(attempt: Attempt) {
    const now = Date.now();

    // Check if ban time has passed.
    if (this.wasBanned()) {
      this.attempts = [];
      this.banTime = 0;
    }

    // Remove too old attempts
    this.attempts = this.attempts.filter(
      (attempt) => attempt.timestamp + PinAttempts.pinMaxAttemptsTtl > now,
    );

    // Add new attempt
    this.attempts.push(attempt);

    // If user has too many attempts...
    if (this.attempts.length >= PinAttempts.pinMaxAttempts) {
      this.banUser();
    }
  }

  private banUser() {
    // Get timeout ban period.
    let timeout = 2 ** this.attempts.length;

    if (timeout >= PinAttempts.pinMaxBanTimeoutMinutes) {
      timeout = PinAttempts.pinMaxBanTimeoutMinutes;
    }

    // Avoid eternal ban.
    timeout = Math.max(timeout, PinAttempts.pinMaxBanTimeoutMinutes);

    // Avoid no ban.
    timeout = Math.min(timeout, PinAttempts.pinMinBanTimeoutMinutes);

    // Ban user...
    this.banTime = Date.now() + timeout * 60 * 1000;
  }

  private wasBanned() {
    return this.banTime > 0 && !this.isBanned();
  }

  public isBanned() {
    return this.banTime > Date.now();
  }

  public getNumberOfAttempts() {
    return this.attempts.length;
  }
}

/**
 * Grant access to endpoints if user knows his pin.
 */
@Injectable()
export class PinGuard implements CanActivate {
  /**
   * Default constructor builds a local pin verifier.
   * @param hashService Password hash compare service.
   * @param validator validate service.
   * @param logger Global logger.
   */
  constructor(
    private readonly hashService: BcryptHashService,
    @InjectValidator() private readonly validator: Validator,
    @InjectLogger() private readonly logger: Logger,
    readonly configService: ConfigService<PinConfig>,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: PinGuard.name });
    PinAttempts.pinMaxAttempts = Number(
      configService.get<number>('APP_PIN_MAX_ATTEMPTS', 3),
    );
    PinAttempts.pinMaxAttemptsTtl =
      Number(
        configService.get<number>(
          'APP_PIN_MAX_ATTEMPTS_TTL',
          3 * 30 * 24 * 60 * 60, // Default: 3 months
        ),
      ) * 1000;
    PinAttempts.pinMaxBanTimeoutMinutes = Number(
      configService.get<number>('APP_PIN_MAX_BAN_TIMEOUT_MINUTES', 2),
    );
    PinAttempts.pinMinBanTimeoutMinutes = Number(
      configService.get<number>('APP_PIN_MIN_BAN_TIMEOUT_MINUTES', 1),
    );
  }

  /**
   * Check if user knows his pin. If user does not know his pin then he will be
   * banned for a time.
   *
   * @param context Request context.
   * @returns True, if user knows his pin. False, if user does not know his pin.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request: any = null;

    // Check if it is a HTTP request.
    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    const requestId = request.id;
    const logger = this.logger.child({ loggerId: requestId });

    // Check if user is authenticated by JWT token.
    if (!request.user) {
      throw new NullPointerException(
        'Request user is not defined. Check if JwtAuthGuard is available.',
      );
    }

    // Check if pin was defined
    if (!request.body?.pin) {
      throw new BadRequestException();
    }

    // Check if user sent pin on body.
    const sentPin = new PinBody({ pin: request.body.pin });
    await this.validator(sentPin);

    // Get authenticated user from request.
    const authUser: AuthUser = request.user;
    logger.debug('Authenticated user.', { authUser });

    const keyName = `User:${authUser.uuid}:pin`;
    const pinAttemptsKeyName = `${keyName}:pinAttempts`;
    const lockKeyName = `${keyName}:lock`;

    const mutex = new Mutex(this.redisService.getClient(), lockKeyName, {
      acquireAttemptsLimit: 5,
      retryInterval: 1000,
      lockTimeout: PinAttempts.pinMaxAttemptsTtl,
      refreshInterval: 1000,
    });

    const lockAquired = await mutex.tryAcquire();

    if (!lockAquired) {
      this.logger.warn('User is trying to bypass pin protection', { authUser });

      // Kick user.
      throw new UnauthorizedException(authUser.uuid);
    }

    try {
      const now = Date.now();

      // Get previous attempts
      const pinAttemptsKeys =
        await this.redisService.get<PinAttempts>(pinAttemptsKeyName);

      // If no previous found, create a new one.
      const pinAttempts = new PinAttempts(pinAttemptsKeys?.data);

      const attempt: Attempt = {
        timestamp: now,
      };

      // Add new attempt
      pinAttempts.addAttempt(attempt);

      // Remember new failed attempt
      await this.redisService.set<PinAttempts>({
        key: pinAttemptsKeyName,
        data: pinAttempts,
        ttl: PinAttempts.pinMaxBanTimeoutMinutes * 60 * 1000,
      });

      // Kick banned user.
      if (pinAttempts.isBanned()) {
        logger.warn('User is in ban period.', { pinAttempts, now });

        // Kick user.
        throw new UnauthorizedException();
      }

      // Check if pin sent does not match to the stored one.
      if (
        !authUser.pinHasCreated ||
        !this.hashService.compareHash(request.body.pin, authUser.pin)
      ) {
        logger.debug('Pin does not match. Incrementing attempts...', {
          userPinAttempts: pinAttempts,
        });

        // Kick user.
        throw new UnauthorizedException({
          remaining:
            PinAttempts.pinMaxAttempts - pinAttempts.getNumberOfAttempts(),
        });
      }

      logger.info('Pin validated.');

      // Reset failed attempts
      await this.redisService.delete<number>(pinAttemptsKeyName);

      // Prevent pin to be propagated to another step.
      request.body.pin = '****';
    } finally {
      await mutex.release();
    }

    return true;
  }
}
