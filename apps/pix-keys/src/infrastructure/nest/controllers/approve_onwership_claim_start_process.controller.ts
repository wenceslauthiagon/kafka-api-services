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
  ApproveOwnershipClaimStartProcessController,
  ApproveOwnershipClaimStartProcessRequest,
  ApproveOwnershipClaimStartProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class ApproveOwnershipClaimStartProcessRequestDto
  implements ApproveOwnershipClaimStartProcessRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  constructor(props: ApproveOwnershipClaimStartProcessRequest) {
    Object.assign(this, props);
  }
}

export type ApproveOwnershipClaimStartProcessResponseDto =
  ApproveOwnershipClaimStartProcessResponse;

export type ApproveOwnershipClaimStartProcessKafkaRequest =
  KafkaMessage<ApproveOwnershipClaimStartProcessRequestDto>;

export type ApproveOwnershipClaimStartProcessKafkaResponse =
  KafkaResponse<ApproveOwnershipClaimStartProcessResponseDto>;

/**
 * ApproveOwnershipClaimStartProcess controller.
 */
@Controller()
@MicroserviceController()
export class ApproveOwnershipClaimStartProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of start ownership process.
   *
   * @param pixKeyRepository User repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.START_OWNERSHIP_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ApproveOwnershipClaimStartProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: ApproveOwnershipClaimStartProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ApproveOwnershipClaimStartProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ApproveOwnershipClaimStartProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Start ownership process.', { payload });

    // Create and call start ownership process controller.
    const controller = new ApproveOwnershipClaimStartProcessController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Create and call start process.
    const pixKey = await controller.execute(payload);

    logger.info('Ownership process started.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
