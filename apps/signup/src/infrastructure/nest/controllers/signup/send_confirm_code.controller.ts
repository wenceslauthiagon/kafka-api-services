import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import { SignupRepository } from '@zro/signup/domain';
import {
  SendConfirmCodeSignupController,
  SendConfirmCodeSignupRequest,
} from '@zro/signup/interface';
import {
  KAFKA_TOPICS,
  SignupDatabaseRepository,
  NotificationServiceKafka,
} from '@zro/signup/infrastructure';

export type SendConfirmCodeSignupKafkaRequest =
  KafkaMessage<SendConfirmCodeSignupRequest>;

export interface SendConfirmCodeSignupConfig {
  APP_SIGNUP_EMAIL_TAG: string;
  APP_SIGNUP_EMAIL_FROM: string;
}

/**
 * Signup RPC controller.
 */
@Controller()
@MicroserviceController()
export class SendConfirmCodeSignupMicroserviceController {
  private readonly emailTag: string;
  private readonly emailFrom: string;

  constructor(
    private readonly configService: ConfigService<SendConfirmCodeSignupConfig>,
  ) {
    this.emailTag = this.configService.get<string>(
      'APP_SIGNUP_EMAIL_TAG',
      'API_USERS_EMAIL_VALIDATE_CODE',
    );

    this.emailFrom = this.configService.get<string>('APP_SIGNUP_EMAIL_FROM');

    if (!this.emailFrom || !this.emailTag) {
      throw new MissingEnvVarException([
        ...(!this.emailFrom ? ['APP_SIGNUP_EMAIL_FROM'] : []),
        ...(!this.emailTag ? ['APP_SIGNUP_EMAIL_TAG'] : []),
      ]);
    }
  }

  /**
   * Consumer of signup.
   *
   * @param signupRepository Signup repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SIGNUP.SEND_CONFIRM_CODE)
  async execute(
    @RepositoryParam(SignupDatabaseRepository)
    signupRepository: SignupRepository,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationServiceKafka,
    @LoggerParam(SendConfirmCodeSignupMicroserviceController)
    logger: Logger,
    @Payload('value') message: SendConfirmCodeSignupRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new SendConfirmCodeSignupRequest(message);

    // SendConfirmCode and call signup controller.
    const controller = new SendConfirmCodeSignupController(
      logger,
      signupRepository,
      notificationService,
      this.emailTag,
      this.emailFrom,
    );

    // SendConfirmCode signup
    await controller.execute(payload);

    logger.info('Sent Signup confirm code.');
  }
}
