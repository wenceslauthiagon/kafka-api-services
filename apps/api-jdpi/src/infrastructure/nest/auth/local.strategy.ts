import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Strategy } from 'passport-local';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  InjectValidator,
  Validator,
  InjectLogger,
  MissingEnvVarException,
} from '@zro/common';
import { JdpiAuthClient } from '@zro/api-jdpi/domain';
import {
  AuthenticateRestRequest,
  JdpiConfig,
} from '@zro/api-jdpi/infrastructure';

/**
 * Implement local strategy. Authenticate jdpiClient with id and secret.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly jpdiClientSecret: string;
  private readonly jdpiClientId: string;

  /**
   * Default constructor builds a local logger instance.
   * @param configService Config Service.
   * @param validator validate service.
   * @param logger Global logger.
   */
  constructor(
    configService: ConfigService<JdpiConfig>,
    @InjectValidator() private readonly validator: Validator,
    @InjectLogger() private readonly logger: Logger,
  ) {
    // Tells passport to get clientId, clientSecret from request body.
    super({
      usernameField: 'client_id',
      passwordField: 'client_secret',
      passReqToCallback: true,
    });
    this.logger = logger.child({ context: LocalStrategy.name });

    this.jdpiClientId = configService.get<string>('APP_CLIENT_ID');
    this.jpdiClientSecret = configService.get<string>('APP_CLIENT_SECRET');

    if (!this.jdpiClientId || !this.jpdiClientSecret) {
      throw new MissingEnvVarException([
        ...(!this.jdpiClientId ? ['APP_CLIENT_ID'] : []),
        ...(!this.jpdiClientSecret ? ['APP_CLIENT_SECRET'] : []),
      ]);
    }
  }

  /**
   * Authenticate Jdpi client by id and secret.
   * @param request The express request object.
   * @param clientId Jdpi client Id.
   * @param clientSecret Jdpi client secret.
   * @returns Authenticated Jdpi client.
   */
  async validate(
    request: any,
    clientId: string,
    clientSecret: string,
  ): Promise<JdpiAuthClient> {
    const requestId = request?.id ?? uuidV4();
    const logger = this.logger.child({ loggerId: requestId });

    const { scope, grant_type: grantType } = request?.body;

    logger.debug('Authenticating jdpiClient.', { clientId });

    const payload = new AuthenticateRestRequest({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      scope,
    });
    await this.validator(payload);

    if (clientId !== this.jdpiClientId) {
      logger.debug('JdpiClient not found.');
      throw new UnauthorizedException();
    }

    // If password is incorret, kick user.
    if (clientSecret !== this.jpdiClientSecret) {
      this.logger.debug('JdpiClient secret wrong.');
      throw new UnauthorizedException();
    }

    logger.debug('Client authenticated successfully.');

    // All required data are available on access token payload.
    return {
      id: clientId,
      scope,
    };
  }
}
