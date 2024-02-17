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
  WaitOwnershipClaimProcessController,
  WaitOwnershipClaimProcessRequest,
  WaitOwnershipClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class WaitOwnershipClaimProcessRequestDto
  implements WaitOwnershipClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: WaitOwnershipClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type WaitOwnershipClaimProcessResponseDto =
  WaitOwnershipClaimProcessResponse;

export type WaitOwnershipClaimProcessKafkaRequest =
  KafkaMessage<WaitOwnershipClaimProcessRequestDto>;

export type WaitOwnershipClaimProcessKafkaResponse =
  KafkaResponse<WaitOwnershipClaimProcessResponseDto>;

/**
 * WaitOwnershipClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class WaitOwnershipClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of wait ownership process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param pixKeyClaimRepository Pix Key Claim repository.
   * @param eventEmitter Pix Key event emitter.
   * @param logger Global logger instance.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.WAIT_OWNERSHIP_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(WaitOwnershipClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: WaitOwnershipClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<WaitOwnershipClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new WaitOwnershipClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Wait ownership process.', { payload });

    // Create and call wait ownership process controller.
    const controller = new WaitOwnershipClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );

    // Create and call wait process.
    const pixKey = await controller.execute(payload);

    logger.info('Ownership process wait.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
