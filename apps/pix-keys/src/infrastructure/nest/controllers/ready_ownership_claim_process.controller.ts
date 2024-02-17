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
  ReadyOwnershipClaimProcessController,
  ReadyOwnershipClaimProcessRequest,
  ReadyOwnershipClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class ReadyOwnershipClaimProcessRequestDto
  implements ReadyOwnershipClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: ReadyOwnershipClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type ReadyOwnershipClaimProcessResponseDto =
  ReadyOwnershipClaimProcessResponse;

export type ReadyOwnershipClaimProcessKafkaRequest =
  KafkaMessage<ReadyOwnershipClaimProcessRequestDto>;

export type ReadyOwnershipClaimProcessKafkaResponse =
  KafkaResponse<ReadyOwnershipClaimProcessResponseDto>;

/**
 * ReadyOwnershipClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class ReadyOwnershipClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of ready ownership process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.READY_OWNERSHIP_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ReadyOwnershipClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: ReadyOwnershipClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ReadyOwnershipClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ReadyOwnershipClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Ready ownership process.', { payload });

    // Create and call ready ownership process controller.
    const controller = new ReadyOwnershipClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );

    // Create and call ready process.
    const pixKey = await controller.execute(payload);

    logger.info('Ownership process ready.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
