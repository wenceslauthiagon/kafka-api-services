import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BcryptHashService,
  InjectLogger,
  InjectValidator,
  UnauthorizedException,
  Validator,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { GetAdminByEmailRequest } from '@zro/admin/interface';
import {
  GetAdminByEmailServiceKafka,
  AuthenticateRestRequest,
} from '@zro/api-admin/infrastructure';

/**
 * Implement local strategy. Authenticate admin with email and password.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  /**
   * Default constructor builds a local logger instance.
   * @param getAdminService Admin microservice.
   * @param hashService Password hash compare service.
   * @param logger Global logger.
   */
  constructor(
    private readonly getAdminService: GetAdminByEmailServiceKafka,
    private readonly hashService: BcryptHashService,
    @InjectValidator() private readonly validator: Validator,
    @InjectLogger() private readonly logger: Logger,
  ) {
    // Tells passport to get email and password from request body.
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
    this.logger = logger.child({ context: LocalStrategy.name });
  }

  /**
   * Authenticate admin by email and password.
   * @param email Admin email.
   * @param password Admin password.
   * @returns Authenticated admin.
   */
  async validate(email: string, password: string): Promise<AuthAdmin> {
    const requestId = uuidV4();
    const logger = this.logger.child({ loggerId: requestId });

    logger.debug('Authenticating admin.', { email });

    const payload = new AuthenticateRestRequest({ email, password });
    await this.validator(payload);

    const adminData: GetAdminByEmailRequest = {
      email,
    };

    // Get admin data.
    const admin = await this.getAdminService.execute(requestId, adminData);

    // If no admin found, kick admin.
    if (!admin) {
      logger.debug('Admin not found.', { email });
      throw new UnauthorizedException();
    }

    // If password is incorret, kick admin.
    if (!this.hashService.compareHash(password, admin.password)) {
      logger.debug('Password does not match.', { email });
      throw new UnauthorizedException();
    }

    logger.debug('Admin authenticated successfully.', { email });

    return {
      id: admin.id,
      email: admin.email,
    };
  }
}
