import { IsUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  InjectValidator,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import {
  PixKeyRepository,
  PixKeyVerificationRepository,
} from '@zro/pix-keys/domain';
import { NotificationService } from '@zro/pix-keys/application';
import {
  KAFKA_TOPICS,
  NotificationServiceKafka,
  PixKeyDatabaseRepository,
  PixKeyVerificationDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import {
  SendCodePixKeyController,
  SendCodePixKeyRequest,
} from '@zro/pix-keys/interface';

export class SendCodePixKeyRequestDto implements SendCodePixKeyRequest {
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  constructor(props: SendCodePixKeyRequest) {
    Object.assign(this, props);
  }
}

export type SendCodePixKeyKafkaRequest = KafkaMessage<SendCodePixKeyRequestDto>;

interface SendCodePixKeyControllerConfig {
  APP_PIX_KEY_SEND_CODE_EMAIL_TAG: string;
  APP_PIX_KEY_SEND_CODE_EMAIL_FROM: string;
  APP_PIX_KEY_SEND_CODE_SMS_TAG: string;
}

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class SendCodePixKeyMicroserviceController {
  /**
   * Send code e-mail template tag.
   */
  private readonly pixKeySendCodeEmailTag: string;

  /**
   * Send code e-mail from.
   */
  private readonly pixKeySendCodeEmailFrom: string;

  /**
   * Send code SMS template tag.
   */
  private readonly pixKeySendCodeSmsTag: string;

  /**
   * Default pixKey RPC controller constructor.
   */
  constructor(
    @InjectValidator() private validate: Validator,
    configService: ConfigService<SendCodePixKeyControllerConfig>,
  ) {
    this.pixKeySendCodeEmailTag = configService.get<string>(
      'APP_PIX_KEY_SEND_CODE_EMAIL_TAG',
    );
    this.pixKeySendCodeEmailFrom = configService.get<string>(
      'APP_PIX_KEY_SEND_CODE_EMAIL_FROM',
    );
    this.pixKeySendCodeSmsTag = configService.get<string>(
      'APP_PIX_KEY_SEND_CODE_SMS_TAG',
    );
  }

  /**
   * Consumer of send pixKey verification code.
   *
   * @param pixKeyRepository Pix key repository.
   * @param pixKeyVerificationRepository Pix key verification repository.
   * @param eventEmitter Pix key event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.SEND_CODE)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyVerificationDatabaseRepository)
    pixKeyVerificationRepository: PixKeyVerificationRepository,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationService,
    @LoggerParam(SendCodePixKeyMicroserviceController) logger: Logger,
    @Payload('value') message: SendCodePixKeyRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new SendCodePixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Send pixKey verification code.', { payload });

    // Create and call send code controller.
    const controller = new SendCodePixKeyController(
      logger,
      pixKeyRepository,
      pixKeyVerificationRepository,
      notificationService,
      this.pixKeySendCodeEmailTag,
      this.pixKeySendCodeEmailFrom,
      this.pixKeySendCodeSmsTag,
    );

    // Send code.
    const pixKey = await controller.execute(payload);

    logger.info('Verification code sent.', { pixKey });
  }
}
