import { IsUUID } from 'class-validator';
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
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  ApprovePortabilityClaimStartProcessController,
  ApprovePortabilityClaimStartProcessRequest,
  ApprovePortabilityClaimStartProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class ApprovePortabilityClaimStartProcessRequestDto
  implements ApprovePortabilityClaimStartProcessRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  constructor(props: ApprovePortabilityClaimStartProcessRequest) {
    Object.assign(this, props);
  }
}

export type ApprovePortabilityClaimStartProcessResponseDto =
  ApprovePortabilityClaimStartProcessResponse;

export type ApprovePortabilityClaimStartProcessKafkaRequest =
  KafkaMessage<ApprovePortabilityClaimStartProcessRequestDto>;

export type ApprovePortabilityClaimStartProcessKafkaResponse =
  KafkaResponse<ApprovePortabilityClaimStartProcessResponseDto>;

/**
 * ApprovePortabilityClaimStartProcess controller.
 */
@Controller()
@MicroserviceController()
export class ApprovePortabilityClaimStartProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of start portability process.
   *
   * @param pixKeyRepository User repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.START_PORTABILITY_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ApprovePortabilityClaimStartProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: ApprovePortabilityClaimStartProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ApprovePortabilityClaimStartProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ApprovePortabilityClaimStartProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Start portability process.', { payload });

    // Create and call start portability process controller.
    const controller = new ApprovePortabilityClaimStartProcessController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Create and call start process.
    const pixKey = await controller.execute(payload);

    logger.info('Portability process started.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
