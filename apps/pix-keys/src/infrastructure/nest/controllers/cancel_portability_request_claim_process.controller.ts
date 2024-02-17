import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
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
  CancelPortabilityRequestClaimProcessController,
  CancelPortabilityRequestClaimProcessRequest,
  CancelPortabilityRequestClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CancelPortabilityRequestClaimProcessRequestDto
  implements CancelPortabilityRequestClaimProcessRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: CancelPortabilityRequestClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type CancelPortabilityRequestClaimProcessResponseDto =
  CancelPortabilityRequestClaimProcessResponse;

export type CancelPortabilityRequestClaimProcessKafkaRequest =
  KafkaMessage<CancelPortabilityRequestClaimProcessRequestDto>;

export type CancelPortabilityRequestClaimProcessKafkaResponse =
  KafkaResponse<CancelPortabilityRequestClaimProcessResponseDto>;

/**
 * CancelPortabilityClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class CancelPortabilityRequestClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of cancel portability process.
   *
   * @param pixKeyRepository User repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CANCEL_PORTABILITY_REQUEST_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CancelPortabilityRequestClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelPortabilityRequestClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelPortabilityRequestClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelPortabilityRequestClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Cancel portability process.', { payload });

    // Create and call cancel portability process controller.
    const controller = new CancelPortabilityRequestClaimProcessController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Create and call cancel process.
    const pixKey = await controller.execute(payload);

    logger.info('Portability process canceled.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
