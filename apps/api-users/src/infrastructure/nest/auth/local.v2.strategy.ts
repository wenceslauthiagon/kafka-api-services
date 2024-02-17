import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  BcryptHashService,
  InjectValidator,
  KafkaService,
  Validator,
  isCnpj,
  isCpf,
  isEmail,
  isMobilePhone,
  InjectLogger,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import {
  GetUserByDocumentRequest,
  GetUserByEmailRequest,
  GetUserByPhoneNumberRequest,
} from '@zro/users/interface';
import { V2AuthenticateRestRequest } from '@zro/api-users/infrastructure';
import {
  GetUserByDocumentServiceKafka,
  GetUserByEmailServiceKafka,
  GetUserByPhoneNumberServiceKafka,
} from '@zro/users/infrastructure';

/**
 * Implement local strategy. Authenticate user with username and password.
 */
@Injectable()
export class V2LocalStrategy extends PassportStrategy(Strategy, 'v2local') {
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
    // Tells passport to get username and password from request body.
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
    });
    this.logger = logger.child({ context: V2LocalStrategy.name });
  }

  /**
   * Authenticate user by username and password.
   * @param request The express request object.
   * @param username User username.
   * @param password User password.
   * @returns Authenticated user.
   */
  async validate(
    request: any,
    username: string,
    password: string,
  ): Promise<AuthUser> {
    const requestId = request?.id ?? uuidV4();

    this.logger = this.logger.child({ loggerId: requestId });
    this.logger.debug('Authenticating user.', { username });

    const payload = new V2AuthenticateRestRequest({
      username,
      password,
      recaptcha_action: request.body?.recaptcha_action,
      recaptcha_key: request.body?.recaptcha_key,
      recaptcha_token: request.body?.recaptcha_token,
    });
    await this.validator(payload);

    let userFound = null;

    if (!userFound && isMobilePhone(username)) {
      const phoneNumber = username.replace(/\+/, '');

      const userData = new GetUserByPhoneNumberRequest({ phoneNumber });

      // Create get user service
      const getUserByPhoneNumberService = new GetUserByPhoneNumberServiceKafka(
        requestId,
        this.logger,
        this.kafkaService,
      );

      // Get user data.
      userFound = await getUserByPhoneNumberService.execute(userData);
    }

    if (!userFound && isEmail(username)) {
      const userData = new GetUserByEmailRequest({
        email: username,
      });

      // Create get user login service
      const getUserEmailService = new GetUserByEmailServiceKafka(
        requestId,
        this.logger,
        this.kafkaService,
      );

      // Get user data.
      userFound = await getUserEmailService.execute(userData);
    }

    if (!userFound && (isCpf(username) || isCnpj(username))) {
      const document = username.replace(/(\.|-|\/)/g, '');

      const userData = new GetUserByDocumentRequest({
        document,
      });

      // Create get user service
      const getUserByDocumentService = new GetUserByDocumentServiceKafka(
        requestId,
        this.logger,
        this.kafkaService,
      );

      // Get user data.
      userFound = await getUserByDocumentService.execute(userData);
    }

    // If no user found, kick user.
    if (!userFound) {
      this.logger.debug('User not found.', { username });
      throw new UnauthorizedException();
    }

    // If user is not active, kick user.
    if (!userFound.active) {
      this.logger.debug('User is not active.', { username });
      throw new UnauthorizedException();
    }

    // If password is incorret, kick user.
    if (!this.hashService.compareHash(password, userFound.password)) {
      this.logger.debug('Password does not match.', { username });
      throw new UnauthorizedException();
    }

    this.logger.debug('User authenticated successfully.', { username });

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
