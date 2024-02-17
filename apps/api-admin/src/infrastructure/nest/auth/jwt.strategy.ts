import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { InjectLogger, JwtConfig } from '@zro/common';
import { AccessToken, AuthAdmin } from '@zro/api-admin/domain';
import { GetAdminByEmailRequest } from '@zro/admin/interface';
import { GetAdminByEmailServiceKafka } from '@zro/api-admin/infrastructure';

/**
 * Implement JWT authentication strategy. Get access token from authentication
 * header, verify and decode it.
 * Should be necessary to call admin microservice to get additional admin data
 * because old token format.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Default constructor. Instanciate JWT service to verify and decode access
   * token.
   *
   * @param getAdminService Admin microservice.
   * @param configService Configuration data.
   * @param logger Global logger
   */
  constructor(
    private readonly getAdminService: GetAdminByEmailServiceKafka,
    configService: ConfigService<JwtConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    // Build JWT service.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: configService.get<boolean>('APP_JWT_IGNORE_EXPIRATION'),
      secretOrKey: configService.get<string>('APP_JWT_TOKEN'),
    });
    this.logger = logger.child({ context: JwtStrategy.name });
  }

  /**
   * Decode validated access token payload. Sometimes call admin microservice to get
   * additional admin data.
   *
   * @param payload Validated access token payload.
   * @returns Authenticated admin.
   */
  async validate(payload: AccessToken): Promise<AuthAdmin> {
    // If is new token format then decode it.
    if (payload.version > 0) {
      this.logger.debug('Admin authenticated.', {
        adminId: payload.id,
        version: payload.version,
      });

      // All required data are available on access token payload.
      return {
        id: payload.id,
        email: payload.email,
      };
    } else {
      // We have a legacy token so we need to search admin again :(
      const requestId = uuidV4();
      const logger = this.logger.child({ loggerId: requestId });

      // Create a request.
      const request: GetAdminByEmailRequest = {
        email: payload.email,
      };

      logger.debug('Get additional admin data.', { email: payload.email });

      // Send request to admin service.
      const admin = await this.getAdminService.execute(requestId, request);

      logger.debug('Admin authenticated.', { adminId: admin.id, version: 0 });

      // New we have all required data.
      return {
        id: admin.id,
        email: admin.email,
      };
    }
  }
}
