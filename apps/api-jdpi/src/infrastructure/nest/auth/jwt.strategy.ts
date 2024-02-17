import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectLogger, JwtConfig, MissingEnvVarException } from '@zro/common';
import { AccessToken, JdpiAuthClient } from '@zro/api-jdpi/domain';
import { JdpiConfig } from '@zro/api-jdpi/infrastructure';

/**
 * Implement JWT authentication strategy. Get access token from authentication
 * header, verify and decode it.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly clientId: string;

  /**
   * Default constructor. Instanciate JWT service to verify and decode access
   * token.
   *
   * @param configService Configuration data.
   * @param logger Global logger
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    configService: ConfigService<JwtConfig & JdpiConfig>,
  ) {
    // Build JWT service.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration:
        configService.get<string>('APP_JWT_IGNORE_EXPIRATION') === 'true',
      passReqToCallback: true,
      secretOrKey: configService.get<string>('APP_JWT_TOKEN'),
    });
    this.logger = logger.child({ context: JwtStrategy.name });

    this.clientId = configService.get<string>('APP_CLIENT_ID');
    if (!this.clientId) {
      throw new MissingEnvVarException(['APP_CLIENT_ID']);
    }
  }

  /**
   * Decode validated access token payload.
   *
   * @param request The express request object.
   * @param payload Validated access token payload.
   * @returns Authenticated user.
   */
  async validate(request: any, payload: AccessToken): Promise<JdpiAuthClient> {
    const requestId = request?.id ?? uuidV4();

    const logger = this.logger.child({ loggerId: requestId });

    if (payload.id !== this.clientId) {
      logger.debug('Client not found.', { clientId: payload.id });
      throw new UnauthorizedException();
    }

    const authClient: JdpiAuthClient = {
      id: payload.id,
      scope: payload.scope,
    };

    // New we have all required data.
    return authClient;
  }
}
