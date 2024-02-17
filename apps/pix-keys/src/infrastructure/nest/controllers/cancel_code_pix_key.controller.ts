import { IsEnum, IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  InjectValidator,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { ClaimReasonType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  CancelCodePixKeyController,
  CancelCodePixKeyRequest,
  CancelCodePixKeyResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CancelCodePixKeyRequestDto implements CancelCodePixKeyRequest {
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: CancelCodePixKeyRequest) {
    Object.assign(this, props);
  }
}

export type CancelCodePixKeyResponseDto = CancelCodePixKeyResponse;

export type CancelCodePixKeyKafkaRequest =
  KafkaMessage<CancelCodePixKeyRequestDto>;

export type CancelCodePixKeyKafkaResponse =
  KafkaResponse<CancelCodePixKeyResponseDto>;

/**
 * CancelCodePixKey controller.
 */
@Controller()
@MicroserviceController()
export class CancelCodePixKeyMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of start cancel pix key.
   *
   * @param pixKeyRepository PixKey repository.
   * @param eventEmitter Event emitter.
   * @param logger Unique shared request ID.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CANCEL_CODE)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CancelCodePixKeyMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelCodePixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelCodePixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelCodePixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Cancel code Pix Key process.', { payload });

    // Create and call cancel pix key controller.
    const controller = new CancelCodePixKeyController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Create and call cancel pix key.
    const pixKey = await controller.execute(payload);

    logger.info('Cancel Pix Key started.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
