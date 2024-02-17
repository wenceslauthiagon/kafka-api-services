import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { createHash } from 'crypto';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Milliseconds } from 'cache-manager';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { InjectLogger, KafkaService, RedisService } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AccessToken } from '@zro/api-users/domain';
import { GetUserByPhoneNumberRequest } from '@zro/users/interface';
import { GetUserByPhoneNumberServiceKafka } from '@zro/users/infrastructure';
import { JwtConfig } from './jwt.config';

/**
 * Implement JWT authentication strategy. Get access token from authentication
 * header, verify and decode it.
 * Should be necessary to call user microservice to get additional user data
 * because old token format.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly ttl: Milliseconds;

  /**
   * Default constructor. Instanciate JWT service to verify and decode access
   * token.
   *
   * @param kafkaService Kafka service.
   * @param configService Configuration data.
   * @param logger Global logger
   * @param cache Cache
   */
  constructor(
    private readonly kafkaService: KafkaService,
    readonly configService: ConfigService<JwtConfig>,
    @InjectLogger() private logger: Logger,
    private readonly redisService: RedisService,
  ) {
    // Build JWT service.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: configService.get<boolean>('APP_JWT_IGNORE_EXPIRATION'),
      passReqToCallback: true,
      // This will be uncommented after signin, signup, and forgot password have been fixed.
      // secretOrKey: configService.get<string>('APP_JWT_TOKEN'),
      // This will be removed after signin, signup, and forgot password have been fixed.
      secretOrKeyProvider: (
        request: any,
        rawJwtToken: any,
        done: (err: any, secretOrKey?: string | Buffer) => void,
      ): void => {
        const secret = configService.get<string>('APP_JWT_TOKEN');
        const extra = configService.get<string>('APP_JWT_TOKEN_V2_EXTRA', '');
        const v2PhoneNumbers = configService.get<string>(
          'APP_JWT_V2_EXTRA_PHONE_NUMBERS',
          '',
        );

        const { payload } = jwt.decode(rawJwtToken, { complete: true });
        const accessToken = payload as AccessToken;

        if (v2PhoneNumbers.includes(accessToken.phone_number)) {
          done(null, secret + extra);
        } else {
          done(null, secret);
        }
      },
    });
    this.logger = logger.child({ context: JwtStrategy.name });
    this.ttl = configService.get<number>('APP_JWT_CACHE_TTL_S', 60) * 1000;
  }

  /**
   * Decode validated access token payload. Sometimes call user microservice to get
   * additional user data.
   *
   * @param request The express request object.
   * @param payload Validated access token payload.
   * @returns Authenticated user.
   */
  async validate(request: any, payload: AccessToken): Promise<AuthUser> {
    const requestId = request?.id ?? uuidV4();

    this.logger = this.logger.child({ loggerId: requestId });

    // We have a legacy token so we need to search user again :(
    const phoneNumber = payload.phone_number;

    // Create a request.
    const getRequest = new GetUserByPhoneNumberRequest({ phoneNumber });

    this.logger.debug('Get additional user data.', { phoneNumber });

    const getUserByPhoneNumberService = new GetUserByPhoneNumberServiceKafka(
      requestId,
      this.logger,
      this.kafkaService,
    );

    // Send request to user service.
    const user = await getUserByPhoneNumberService.execute(getRequest);

    this.logger.debug('User authenticated.', { user, version: 0 });

    // If no user found, kick user.
    if (!user) {
      this.logger.debug('User not found.', { phoneNumber });
      throw new UnauthorizedException();
    }

    // If user is not active, kick user.
    if (!user.active) {
      this.logger.debug('User is not active.', { phoneNumber });
      throw new UnauthorizedException();
    }

    const authUser: AuthUser = {
      id: user.id,
      uuid: user.uuid,
      phoneNumber: user.phoneNumber,
      email: user.email,
      pin: user.pin,
      pinHasCreated: user.pinHasCreated,
      active: user.active,
      password: user.password,
      type: user.type,
    };

    const { headers } = request;

    if (headers && headers['authorization']) {
      const token: string = headers['authorization'];
      const hash = createHash('sha1').update(token).digest('base64');

      await Promise.all([
        this.redisService.set<AuthUser>({
          key: `authorization-${hash}`,
          data: authUser,
          ttl: this.ttl,
        }),
        this.redisService.set<string>({
          key: `authorization-${authUser.uuid}`,
          data: hash,
          ttl: this.ttl,
        }),
      ]);
    }

    // New we have all required data.
    return authUser;
  }
}
