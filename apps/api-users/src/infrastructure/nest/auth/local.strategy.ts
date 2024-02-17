import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  BcryptHashService,
  InjectLogger,
  InjectValidator,
  KafkaService,
  Validator,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { GetUserByPhoneNumberRequest } from '@zro/users/interface';
import { AuthenticateRestRequest } from '@zro/api-users/infrastructure';
import { GetUserByPhoneNumberServiceKafka } from '@zro/users/infrastructure';

/**
 * Implement local strategy. Authenticate user with phone number and password.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  /**
   * Default constructor builds a local logger instance.
   * @param kafkaService Kafka service.
   * @param hashService Password hash compare service.
   * @param validator validate service.
   * @param logger Global logger.
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly hashService: BcryptHashService,
    @InjectValidator() private readonly validator: Validator,
    @InjectLogger() private logger: Logger,
  ) {
    // Tells passport to get phoneNumber and password from request body.
    super({
      usernameField: 'phone_number',
      passwordField: 'password',
      passReqToCallback: true,
    });
    this.logger = logger.child({ context: LocalStrategy.name });
  }

  /**
   * Authenticate user by phone number and password.
   * @param request The express request object.
   * @param phoneNumber User phone number.
   * @param password User password.
   * @returns Authenticated user.
   */
  async validate(
    request: any,
    phoneNumber: string,
    password: string,
  ): Promise<AuthUser> {
    const requestId = request?.id ?? uuidV4();

    this.logger = this.logger.child({ loggerId: requestId });
    this.logger.debug('Authenticating user.', { phoneNumber });

    const payload = new AuthenticateRestRequest({
      phone_number: phoneNumber,
      password,
      recaptcha_action: request.body?.recaptcha_action,
      recaptcha_key: request.body?.recaptcha_key,
      recaptcha_token: request.body?.recaptcha_token,
    });
    await this.validator(payload);

    phoneNumber = phoneNumber.replace(/\+/, '');

    const userData = new GetUserByPhoneNumberRequest({ phoneNumber });

    // Create get user service
    const getUserByPhoneNumberService = new GetUserByPhoneNumberServiceKafka(
      requestId,
      this.logger,
      this.kafkaService,
    );

    // Get user data.
    const userFound = await getUserByPhoneNumberService.execute(userData);

    // If no user found, kick user.
    if (!userFound) {
      this.logger.debug('User not found.', { phoneNumber });
      throw new UnauthorizedException();
    }

    // If user is not active, kick user.
    if (!userFound.active) {
      this.logger.debug('User is not active.', { phoneNumber });
      throw new UnauthorizedException();
    }

    // If password is incorret, kick user.
    if (!this.hashService.compareHash(password, userFound.password)) {
      this.logger.debug('Password does not match.', { phoneNumber });
      throw new UnauthorizedException();
    }

    this.logger.debug('User authenticated successfully.', { phoneNumber });

    // All required data are available on access token payload.
    return {
      id: userFound.id,
      uuid: userFound.uuid,
      phoneNumber: userFound.phoneNumber,
      email: userFound.email,
      pin: userFound.pin,
      pinHasCreated: userFound.pinHasCreated,
      active: userFound.active,
      password: userFound.password,
      type: userFound.type,
    };
  }
}
