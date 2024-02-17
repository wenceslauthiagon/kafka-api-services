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
import {
  GetUserApiKeyByIdRequest,
  GetUserApiKeyByIdResponse,
  GetUserByUuidRequest,
  GetUserByUuidResponse,
} from '@zro/users/interface';
import { AuthenticateRestRequest } from '@zro/api-paas/infrastructure';
import {
  GetUserApiKeyByIdServiceKafka,
  GetUserByUuidServiceKafka,
} from '@zro/users/infrastructure';

/**
 * Implement local strategy. Authenticate user with api key id and api key hash.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
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
    // Tells passport to get apiId and apiKey from request body.
    super({
      usernameField: 'api_id',
      passwordField: 'api_key',
      passReqToCallback: true,
    });
    this.logger = logger.child({ context: LocalStrategy.name });
  }

  /**
   * Authenticate user by api id and api key.
   * @param request The express request object.
   * @param apiId User api id.
   * @param apiKey User api key.
   * @returns Authenticated user.
   */
  async validate(
    request: any,
    apiId: string,
    apiKey: string,
  ): Promise<AuthUser> {
    const requestId = request?.id ?? uuidV4();

    this.logger = this.logger.child({ loggerId: requestId });
    this.logger.debug('Authenticating user.', { apiId });

    const payload = new AuthenticateRestRequest({
      api_id: apiId,
      api_key: apiKey,
    });
    await this.validator(payload);

    const userApiKey = await this.getUserApiKeyById(requestId, apiId);

    // If apiKey is incorret, kick userApiKey.
    if (!this.hashService.compareHash(apiKey, userApiKey.hash)) {
      this.logger.debug('Api key does not match.');
      throw new UnauthorizedException();
    }

    this.logger.debug('User authenticated successfully.', {
      userId: userApiKey.userId,
    });

    const userFound = await this.getUserByUuid(requestId, userApiKey.userId);

    // All required data are available on access token payload.
    return {
      id: userFound.id,
      uuid: userFound.uuid,
      phoneNumber: userFound.phoneNumber,
      password: userFound.password,
      pin: userFound.pin,
      pinHasCreated: userFound.pinHasCreated,
      active: userFound.active,
      apiId,
      type: userFound.type,
    };
  }

  private async getUserApiKeyById(
    requestId: string,
    apiId: string,
  ): Promise<GetUserApiKeyByIdResponse> {
    const userApiKeyData: GetUserApiKeyByIdRequest = { id: apiId };

    // Create get user service
    const getUserApiKeyById = new GetUserApiKeyByIdServiceKafka(
      requestId,
      this.logger,
      this.kafkaService,
    );

    // Get userApiKey data.
    const userApiKey = await getUserApiKeyById.execute(userApiKeyData);

    // If no userApiKey found, kick userApiKey.
    if (!userApiKey) {
      this.logger.debug('User not found.', { apiId });
      throw new UnauthorizedException();
    }

    return userApiKey;
  }

  private async getUserByUuid(
    requestId: string,
    uuid: string,
  ): Promise<GetUserByUuidResponse> {
    const userData: GetUserByUuidRequest = { uuid };

    //Call get User
    const getUserByUuidService = new GetUserByUuidServiceKafka(
      requestId,
      this.logger,
      this.kafkaService,
    );

    // Get user data.
    const user = await getUserByUuidService.execute(userData);

    // If no user found, kick user.
    if (!user) {
      this.logger.debug('User not found.', { uuid });
      throw new UnauthorizedException();
    }

    // If user is not active, kick user.
    if (!user.active) {
      this.logger.debug('User is not active.', { uuid });
      throw new UnauthorizedException();
    }

    return user;
  }
}
