import { IsEmail, MaxLength } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  InjectValidator,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
  BcryptHashService,
} from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  KAFKA_TOPICS,
  NotificationServiceKafka,
  AdminDatabaseRepository,
} from '@zro/admin/infrastructure';
import {
  SendForgetPasswordController,
  SendForgetPasswordRequest,
  SendForgetPasswordResponse,
} from '@zro/admin/interface';
import { NotificationService } from '@zro/admin/application';

export class SendForgetPasswordRequestDto implements SendForgetPasswordRequest {
  @IsEmail()
  @MaxLength(255)
  email: string;

  constructor(props: SendForgetPasswordRequest) {
    Object.assign(this, props);
  }
}

export type SendForgetPasswordResponseDto = SendForgetPasswordResponse;

export type SendForgetPasswordKafkaRequest =
  KafkaMessage<SendForgetPasswordRequestDto>;

export type SendForgetPasswordKafkaResponse =
  KafkaResponse<SendForgetPasswordResponseDto>;

export interface SendForgetPasswordControllerConfig {
  APP_SEND_CODE_EMAIL_FROM: string;
  APP_SEND_CODE_EMAIL_TAG: string;
  APP_SEND_CODE_RANDOM_NUMBER_SIZE: number;
  APP_SEND_CODE_TOKEN_ATTEMPT: number;
}

/**
 * Admin controller.
 */
@Controller()
@MicroserviceController()
export class SendForgetPasswordMicroserviceController {
  /**
   * Send code e-mail template tag.
   */
  private adminSendCodeEmailTag: string;

  /**
   * Send code e-mail from.
   */
  private adminSendCodeEmailFrom: string;

  /**
   * Random Number Size for tokenReset.
   */
  private adminSendCodeRandomNumberSize: number;

  /**
   * Number of Token Attempt.
   */
  private adminSendCodeTokenAttempt: number;

  /**
   * Default admin RPC controller constructor.
   */
  constructor(
    @InjectValidator() private validate: Validator,
    configService: ConfigService<SendForgetPasswordControllerConfig>,
    private hashProvider: BcryptHashService,
  ) {
    this.adminSendCodeEmailTag = configService.get<string>(
      'APP_SEND_CODE_EMAIL_TAG',
    );
    this.adminSendCodeEmailFrom = configService.get<string>(
      'APP_SEND_CODE_EMAIL_FROM',
    );
    this.adminSendCodeRandomNumberSize = configService.get<number>(
      'APP_SEND_CODE_RANDOM_NUMBER_SIZE',
    );
    this.adminSendCodeTokenAttempt = configService.get<number>(
      'APP_SEND_CODE_TOKEN_ATTEMPT',
    );
  }

  /**
   * Consumer of send Admin verification code.
   *
   * @param adminRepository Admin repository.
   * @param notificationService Notification service.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN.FORGET_PASSWORD_EMAIL)
  async execute(
    @RepositoryParam(AdminDatabaseRepository)
    adminRepository: AdminRepository,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationService,
    @LoggerParam(SendForgetPasswordMicroserviceController) logger: Logger,
    @Payload('value') message: SendForgetPasswordRequestDto,
    @Ctx() ctx: KafkaContext,
  ): Promise<SendForgetPasswordKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new SendForgetPasswordRequestDto(message);
    await this.validate(payload);

    logger.info('Send forget email verification code.', { payload });

    // Create and call send code controller.
    const controller = new SendForgetPasswordController(
      logger,
      adminRepository,
      notificationService,
      this.hashProvider,
      this.adminSendCodeEmailTag,
      this.adminSendCodeEmailFrom,
      this.adminSendCodeRandomNumberSize,
      this.adminSendCodeTokenAttempt,
    );

    // Send forget password email with verification code.
    const admin = await controller.execute(payload);

    logger.info('Forget password verification code sent.', { admin });

    return {
      ctx,
      value: admin,
    };
  }
}
