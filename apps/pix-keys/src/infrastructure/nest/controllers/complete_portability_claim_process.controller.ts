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
  CompletePortabilityClaimProcessController,
  CompletePortabilityClaimProcessRequest,
  CompletePortabilityClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CompletePortabilityClaimProcessRequestDto
  implements CompletePortabilityClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: CompletePortabilityClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type CompletePortabilityClaimProcessResponseDto =
  CompletePortabilityClaimProcessResponse;

export type CompletePortabilityClaimProcessKafkaRequest =
  KafkaMessage<CompletePortabilityClaimProcessRequestDto>;

export type CompletePortabilityClaimProcessKafkaResponse =
  KafkaResponse<CompletePortabilityClaimProcessResponseDto>;

/**
 * CompletePortabilityClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class CompletePortabilityClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of complete portability process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param pixKeyClaimRepository Pix Key Claim repository.
   * @param eventEmitter Pix Key event emitter.
   * @param logger Global logger instance.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.COMPLETE_PORTABILITY_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CompletePortabilityClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: CompletePortabilityClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CompletePortabilityClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CompletePortabilityClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Complete portability process.', { payload });

    // Create and call complete portability process controller.
    const controller = new CompletePortabilityClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );

    // Create and call complete process.
    const pixKey = await controller.execute(payload);

    logger.info('Portability process completed.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
