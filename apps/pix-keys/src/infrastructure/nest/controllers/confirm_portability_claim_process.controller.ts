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
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  ConfirmPortabilityClaimProcessController,
  ConfirmPortabilityClaimProcessRequest,
  ConfirmPortabilityClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class ConfirmPortabilityClaimProcessRequestDto
  implements ConfirmPortabilityClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: ConfirmPortabilityClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type ConfirmPortabilityClaimProcessResponseDto =
  ConfirmPortabilityClaimProcessResponse;

export type ConfirmPortabilityClaimProcessKafkaRequest =
  KafkaMessage<ConfirmPortabilityClaimProcessRequestDto>;

export type ConfirmPortabilityClaimProcessKafkaResponse =
  KafkaResponse<ConfirmPortabilityClaimProcessResponseDto>;

/**
 * ConfirmPortabilityClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class ConfirmPortabilityClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of confirm portability process.
   *
   * @param pixKeyRepository User repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CONFIRM_PORTABILITY_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ConfirmPortabilityClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: ConfirmPortabilityClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ConfirmPortabilityClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ConfirmPortabilityClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Confirm portability process.', { payload });

    // Create and call confirm portability process controller.
    const controller = new ConfirmPortabilityClaimProcessController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Create and call confirm process.
    const pixKey = await controller.execute(payload);

    logger.info('Portability process confirm.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
