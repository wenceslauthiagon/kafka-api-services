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
  CancelPortabilityClaimProcessController,
  CancelPortabilityClaimProcessRequest,
  CancelPortabilityClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CancelPortabilityClaimProcessRequestDto
  implements CancelPortabilityClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: CancelPortabilityClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type CancelPortabilityClaimProcessResponseDto =
  CancelPortabilityClaimProcessResponse;

export type CancelPortabilityClaimProcessKafkaRequest =
  KafkaMessage<CancelPortabilityClaimProcessRequestDto>;

export type CancelPortabilityClaimProcessKafkaResponse =
  KafkaResponse<CancelPortabilityClaimProcessResponseDto>;

/**
 * CancelPortabilityClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class CancelPortabilityClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of cancel portability process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param pixKeyClaimRepository Pix Key Claim repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CANCEL_PORTABILITY_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CancelPortabilityClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelPortabilityClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelPortabilityClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelPortabilityClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Cancel portability process.', { payload });

    // Create and call cancel portability process controller.
    const controller = new CancelPortabilityClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
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
