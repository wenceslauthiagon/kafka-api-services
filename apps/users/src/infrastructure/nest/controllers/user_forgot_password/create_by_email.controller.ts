import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import {
  UserForgotPasswordRepository,
  UserRepository,
} from '@zro/users/domain';
import {
  CreateUserForgotPasswordByEmailController,
  CreateUserForgotPasswordByEmailRequest,
  CreateUserForgotPasswordByEmailResponse,
  UserForgotPasswordEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  NotificationServiceKafka,
  UserDatabaseRepository,
  UserForgotPasswordDatabaseRepository,
  UserForgotPasswordEventKafkaEmitter,
} from '@zro/users/infrastructure';

export type CreateUserForgotPasswordByEmailKafkaRequest =
  KafkaMessage<CreateUserForgotPasswordByEmailRequest>;
export type CreateUserForgotPasswordByEmailKafkaResponse =
  KafkaResponse<CreateUserForgotPasswordByEmailResponse>;

export interface SendForgotPasswordCodeUserByEmailConfig {
  APP_USER_FORGOT_PASSWORD_EMAIL_TAG: string;
  APP_USER_FORGOT_PASSWORD_EMAIL_FROM: string;
}

/**
 * UserForgotPassword RPC controller.
 */
@Controller()
@MicroserviceController()
export class CreateUserForgotPasswordByEmailMicroserviceController {
  private readonly emailTag: string;
  private readonly emailFrom: string;

  constructor(
    private readonly configService: ConfigService<SendForgotPasswordCodeUserByEmailConfig>,
  ) {
    this.emailTag = this.configService.get<string>(
      'APP_USER_FORGOT_PASSWORD_EMAIL_TAG',
    );
    this.emailFrom = this.configService.get<string>(
      'APP_USER_FORGOT_PASSWORD_EMAIL_FROM',
    );

    if (!this.emailTag || !this.emailFrom) {
      throw new MissingEnvVarException([
        ...(!this.emailTag ? ['APP_USER_FORGOT_PASSWORD_EMAIL_TAG'] : []),
        ...(!this.emailFrom ? ['APP_USER_FORGOT_PASSWORD_EMAIL_FROM'] : []),
      ]);
    }
  }

  /**
   * Consumer of create user forgot password.
   *
   * @param userRepository UserForgotPassword repository.
   * @param userForgotPasswordRepository UserForgotPassword repository.
   * @param userForgotPasswordEventEmitter UserForgotPassword event emitter.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_FORGOT_PASSWORD.CREATE_BY_EMAIL)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @RepositoryParam(UserForgotPasswordDatabaseRepository)
    userForgotPasswordRepository: UserForgotPasswordRepository,
    @EventEmitterParam(UserForgotPasswordEventKafkaEmitter)
    userForgotPasswordEventEmitter: UserForgotPasswordEventEmitterControllerInterface,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationServiceKafka,
    @LoggerParam(CreateUserForgotPasswordByEmailMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateUserForgotPasswordByEmailRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateUserForgotPasswordByEmailKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CreateUserForgotPasswordByEmailRequest(message);

    // Create and call create user forgot password controller.
    const controller = new CreateUserForgotPasswordByEmailController(
      logger,
      userRepository,
      userForgotPasswordRepository,
      userForgotPasswordEventEmitter,
      notificationService,
      this.emailTag,
      this.emailFrom,
    );

    // Create user forgot password
    const userForgotPassword = await controller.execute(payload);

    logger.info('UserForgotPassword created.', { userForgotPassword });

    return {
      ctx,
      value: userForgotPassword,
    };
  }
}
