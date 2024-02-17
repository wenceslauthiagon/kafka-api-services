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
  CompleteOwnershipClaimProcessController,
  CompleteOwnershipClaimProcessRequest,
  CompleteOwnershipClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CompleteOwnershipClaimProcessRequestDto
  implements CompleteOwnershipClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: CompleteOwnershipClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type CompleteOwnershipClaimProcessResponseDto =
  CompleteOwnershipClaimProcessResponse;

export type CompleteOwnershipClaimProcessKafkaRequest =
  KafkaMessage<CompleteOwnershipClaimProcessRequestDto>;

export type CompleteOwnershipClaimProcessKafkaResponse =
  KafkaResponse<CompleteOwnershipClaimProcessResponseDto>;

/**
 * CompleteOwnershipClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class CompleteOwnershipClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of complete ownership process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param pixKeyClaimRepository Pix Key Claim repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.COMPLETE_OWNERSHIP_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CompleteOwnershipClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: CompleteOwnershipClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CompleteOwnershipClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CompleteOwnershipClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Complete ownership process.', { payload });

    // Create and call complete ownership process controller.
    const controller = new CompleteOwnershipClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );

    // Create and call complete process.
    const pixKey = await controller.execute(payload);

    logger.info('Ownership process completed.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
