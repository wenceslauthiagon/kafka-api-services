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
  ApprovePortabilityClaimProcessController,
  ApprovePortabilityClaimProcessRequest,
  ApprovePortabilityClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class ApprovePortabilityClaimProcessRequestDto
  implements ApprovePortabilityClaimProcessRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: ApprovePortabilityClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type ApprovePortabilityClaimProcessResponseDto =
  ApprovePortabilityClaimProcessResponse;

export type ApprovePortabilityClaimProcessKafkaRequest =
  KafkaMessage<ApprovePortabilityClaimProcessRequestDto>;

export type ApprovePortabilityClaimProcessKafkaResponse =
  KafkaResponse<ApprovePortabilityClaimProcessResponseDto>;

/**
 * ApprovePortabilityClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class ApprovePortabilityClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of approve portability process.
   *
   * @param pixKeyRepository User repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.APPROVE_PORTABILITY_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ApprovePortabilityClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: ApprovePortabilityClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ApprovePortabilityClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ApprovePortabilityClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Approve portability process.', { payload });

    // Create and call approve portability process controller.
    const controller = new ApprovePortabilityClaimProcessController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Create and call approve process.
    const pixKey = await controller.execute(payload);

    logger.info('Portability process approved.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
