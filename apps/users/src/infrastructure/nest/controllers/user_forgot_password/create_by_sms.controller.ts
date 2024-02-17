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
  RepositoryParam,
} from '@zro/common';
import {
  UserForgotPasswordRepository,
  UserRepository,
} from '@zro/users/domain';
import { NotificationService } from '@zro/users/application';
import {
  CreateUserForgotPasswordBySmsController,
  CreateUserForgotPasswordBySmsRequest,
  CreateUserForgotPasswordBySmsResponse,
  UserForgotPasswordEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  NotificationServiceKafka,
  UserDatabaseRepository,
  UserForgotPasswordDatabaseRepository,
  UserForgotPasswordEventKafkaEmitter,
} from '@zro/users/infrastructure';

export type CreateUserForgotPasswordBySmsKafkaRequest =
  KafkaMessage<CreateUserForgotPasswordBySmsRequest>;
export type CreateUserForgotPasswordBySmsKafkaResponse =
  KafkaResponse<CreateUserForgotPasswordBySmsResponse>;

export interface SendForgotPasswordCodeUserBySmsConfig {
  APP_USER_FORGOT_PASSWORD_SMS_TAG: string;
}

/**
 * UserForgotPassword RPC controller.
 */
@Controller()
@MicroserviceController()
export class CreateUserForgotPasswordBySmsMicroserviceController {
  private readonly smsTag: string;

  constructor(
    private readonly configService: ConfigService<SendForgotPasswordCodeUserBySmsConfig>,
  ) {
    this.smsTag = this.configService.get<string>(
      'APP_USER_FORGOT_PASSWORD_SMS_TAG',
      'USER_SMS_FORGOT_PASSWORD_CODE',
    );
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
  @KafkaMessagePattern(KAFKA_TOPICS.USER_FORGOT_PASSWORD.CREATE_BY_SMS)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @RepositoryParam(UserForgotPasswordDatabaseRepository)
    userForgotPasswordRepository: UserForgotPasswordRepository,
    @EventEmitterParam(UserForgotPasswordEventKafkaEmitter)
    userForgotPasswordEventEmitter: UserForgotPasswordEventEmitterControllerInterface,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationService,
    @LoggerParam(CreateUserForgotPasswordBySmsMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateUserForgotPasswordBySmsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateUserForgotPasswordBySmsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CreateUserForgotPasswordBySmsRequest(message);

    // Create and call create user forgot password controller.
    const controller = new CreateUserForgotPasswordBySmsController(
      logger,
      userRepository,
      userForgotPasswordRepository,
      userForgotPasswordEventEmitter,
      notificationService,
      this.smsTag,
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
