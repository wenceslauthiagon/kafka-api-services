import { Logger } from 'winston';
import { IsString } from 'class-validator';
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
import { PixKeyClaimRepository, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  CancelOwnershipClaimProcessController,
  CancelOwnershipClaimProcessRequest,
  CancelOwnershipClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CancelOwnershipClaimProcessRequestDto
  implements CancelOwnershipClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: CancelOwnershipClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type CancelOwnershipClaimProcessResponseDto =
  CancelOwnershipClaimProcessResponse;

export type CancelOwnershipClaimProcessKafkaRequest =
  KafkaMessage<CancelOwnershipClaimProcessRequestDto>;

export type CancelOwnershipClaimProcessKafkaResponse =
  KafkaResponse<CancelOwnershipClaimProcessResponseDto>;

/**
 * CancelOwnershipClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class CancelOwnershipClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of cancel ownership process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param pixKeyClaimRepository Pix Key Claim repository.
   * @param eventEmitter Pix Key event emitter.
   * @param logger Global logger instance.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CANCEL_OWNERSHIP_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CancelOwnershipClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelOwnershipClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelOwnershipClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelOwnershipClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Cancel ownership process.', { payload });

    // Create and call cancel ownership process controller.
    const controller = new CancelOwnershipClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );

    // Create and call cancel process.
    const pixKey = await controller.execute(payload);

    logger.info('Ownership process canceled.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
