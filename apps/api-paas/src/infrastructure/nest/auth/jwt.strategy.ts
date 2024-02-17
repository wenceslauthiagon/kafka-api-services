import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { createHash } from 'crypto';
import { Milliseconds } from 'cache-manager';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { InjectLogger, KafkaService, RedisService } from '@zro/common';
import { JwtConfig } from './jwt.config';
import { AccessToken } from '@zro/api-paas/domain';
import { AuthUser } from '@zro/users/domain';
import {
  GetUserApiKeyByUserRequest,
  GetUserApiKeyByUserResponse,
  GetUserByUuidRequest,
  GetUserByUuidResponse,
} from '@zro/users/interface';
import {
  GetUserApiKeyByUserServiceKafka,
  GetUserByUuidServiceKafka,
} from '@zro/users/infrastructure';

/**
 * Implement JWT authentication strategy. Get access token from authentication
 * header, verify and decode it.
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
   * @param redisService Cache
   */
  constructor(
    private readonly kafkaService: KafkaService,
    configService: ConfigService<JwtConfig>,
    @InjectLogger() private logger: Logger,
    private readonly redisService: RedisService,
  ) {
    // Build JWT service.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: configService.get<boolean>('APP_JWT_IGNORE_EXPIRATION'),
      passReqToCallback: true,
      secretOrKey: configService.get<string>('APP_JWT_TOKEN'),
    });
    this.logger = logger.child({ context: JwtStrategy.name });
    this.ttl = configService.get<number>('APP_JWT_CACHE_TTL_S', 60) * 1000;
  }

  /**
   * Decode validated access token payload.
   * @param request The express request object.
   * @param payload Validated access token payload.
   * @returns Authenticated user.
   */
  async validate(request: any, payload: AccessToken): Promise<AuthUser> {
    const requestId = request?.id ?? uuidV4();

    this.logger = this.logger.child({ loggerId: requestId });

    this.logger.debug('User authenticated.', { userId: payload.id });

    const userFound = await this.getUserByUuid(requestId, payload.id);
    const userApiKey = await this.getUserApiKeyByUser(requestId, payload.id);

    // All required data are available on access token payload.
    const authUser: AuthUser = {
      id: userFound.id,
      uuid: userFound.uuid,
      phoneNumber: userFound.phoneNumber,
      pin: userFound.pin,
      pinHasCreated: userFound.pinHasCreated,
      active: userFound.active,
      password: userFound.password,
      apiId: userApiKey.id,
      type: userFound.type,
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

  private async getUserByUuid(
    requestId: string,
    uuid: string,
  ): Promise<GetUserByUuidResponse> {
    // Create a request.
    const request = new GetUserByUuidRequest({ uuid });

    const getUserByUuidService = new GetUserByUuidServiceKafka(
      requestId,
      this.logger,
      this.kafkaService,
    );

    // Send request to user service.
    const user = await getUserByUuidService.execute(request);

    this.logger.debug('User authenticated.', { user });

    // If no user found, kick user.
    if (!user) {
      this.logger.debug('User not found.', { request });
      throw new UnauthorizedException();
    }

    // If user is not active, kick user.
    if (!user.active) {
      this.logger.debug('User is not active.', { request });
      throw new UnauthorizedException();
    }

    return user;
  }

  private async getUserApiKeyByUser(
    requestId: string,
    userId: string,
  ): Promise<GetUserApiKeyByUserResponse> {
    const userApiKeyData: GetUserApiKeyByUserRequest = { userId };

    // Create get user api key service
    const getUserApiKeyByUser = new GetUserApiKeyByUserServiceKafka(
      requestId,
      this.logger,
      this.kafkaService,
    );

    // Get userApiKey data.
    const userApiKey = await getUserApiKeyByUser.execute(userApiKeyData);

    // If no userApiKey found, kick userApiKey.
    if (!userApiKey) {
      this.logger.debug('User api key not found.', { userId });
      throw new UnauthorizedException();
    }

    return userApiKey;
  }
}
