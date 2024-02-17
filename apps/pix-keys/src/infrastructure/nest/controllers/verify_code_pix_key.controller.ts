import { IsEnum, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  InjectValidator,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import {
  ClaimReasonType,
  PixKeyRepository,
  PixKeyVerificationRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitterControllerInterface,
  VerifyCodePixKeyController,
  VerifyCodePixKeyRequest,
  VerifyCodePixKeyResponse,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  PixKeyVerificationDatabaseRepository,
} from '@zro/pix-keys/infrastructure';

export class VerifyCodePixKeyRequestDto implements VerifyCodePixKeyRequest {
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  @Matches(/^[0-9]*$/)
  @IsString()
  @Length(5, 5)
  code: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: VerifyCodePixKeyRequest) {
    Object.assign(this, props);
  }
}

export type VerifyCodePixKeyResponseDto = VerifyCodePixKeyResponse;

export type VerifyCodePixKeyKafkaRequest =
  KafkaMessage<VerifyCodePixKeyRequestDto>;

export type VerifyCodePixKeyKafkaResponse =
  KafkaResponse<VerifyCodePixKeyResponseDto>;

interface VerifyCodePixKeyControllerConfig {
  APP_PIX_KEY_VERIFY_CODE_ALLOWED_RETRIES: number;
}

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class VerifyCodePixKeyMicroserviceController {
  /**
   * Max number of verification tries.
   */
  private readonly pixKeyVerifyCodeAllowedRetries: number;

  /**
   * Default pixKey RPC controller constructor.
   */
  constructor(
    @InjectValidator() private validate: Validator,
    configService: ConfigService<VerifyCodePixKeyControllerConfig>,
  ) {
    this.pixKeyVerifyCodeAllowedRetries = Number(
      configService.get<number>('APP_PIX_KEY_VERIFY_CODE_ALLOWED_RETRIES', 3),
    );
  }

  /**
   * Consumer of verify pixKey code.
   *
   * @param pixKeyRepository Pix key repository.
   * @param pixKeyVerificationRepository Pix key verification repository.
   * @param eventEmitter Pix key event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.VERIFY_CODE)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyVerificationDatabaseRepository)
    pixKeyVerificationRepository: PixKeyVerificationRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(VerifyCodePixKeyMicroserviceController) logger: Logger,
    @Payload('value') message: VerifyCodePixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<VerifyCodePixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new VerifyCodePixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Verify pixKey code.', { payload });

    // Create and call verify code controller.
    const controller = new VerifyCodePixKeyController(
      logger,
      pixKeyRepository,
      pixKeyVerificationRepository,
      eventEmitter,
      this.pixKeyVerifyCodeAllowedRetries,
    );

    // Send code.
    const pixKey = await controller.execute(payload);

    logger.info('Code verifcation result.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
