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
  CancelingOwnershipClaimProcessController,
  CancelingOwnershipClaimProcessRequest,
  CancelingOwnershipClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CancelingOwnershipClaimProcessRequestDto
  implements CancelingOwnershipClaimProcessRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: CancelingOwnershipClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type CancelingOwnershipClaimProcessResponseDto =
  CancelingOwnershipClaimProcessResponse;

export type CancelingOwnershipClaimProcessKafkaRequest =
  KafkaMessage<CancelingOwnershipClaimProcessRequestDto>;

export type CancelingOwnershipClaimProcessKafkaResponse =
  KafkaResponse<CancelingOwnershipClaimProcessResponseDto>;

/**
 * CancelingOwnershipClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class CancelingOwnershipClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of canceling ownership process.
   *
   * @param pixKeyRepository User repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CANCELING_OWNERSHIP_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CancelingOwnershipClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelingOwnershipClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelingOwnershipClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelingOwnershipClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Canceling ownership process.', { payload });

    // Create and call canceling ownership process controller.
    const controller = new CancelingOwnershipClaimProcessController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Create and call canceling process.
    const pixKey = await controller.execute(payload);

    logger.info('Ownership canceling process.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
