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
  CompleteClosingClaimProcessController,
  CompleteClosingClaimProcessRequest,
  CompleteClosingClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CompleteClosingClaimProcessRequestDto
  implements CompleteClosingClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: CompleteClosingClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type CompleteClosingClaimProcessResponseDto =
  CompleteClosingClaimProcessResponse;

export type CompleteClosingClaimProcessKafkaRequest =
  KafkaMessage<CompleteClosingClaimProcessRequestDto>;

export type CompleteClosingClaimProcessKafkaResponse =
  KafkaResponse<CompleteClosingClaimProcessResponseDto>;

/**
 * CompleteClosingClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class CompleteClosingClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of complete closing claim process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.COMPLETE_CLAIM_CLOSING)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CompleteClosingClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: CompleteClosingClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CompleteClosingClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CompleteClosingClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Complete closing claim process.', { payload });

    // Create and call complete closing claim process controller.
    const controller = new CompleteClosingClaimProcessController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Create and call complete closing claim process.
    const pixKey = await controller.execute(payload);

    logger.info('Closing claim completed.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
