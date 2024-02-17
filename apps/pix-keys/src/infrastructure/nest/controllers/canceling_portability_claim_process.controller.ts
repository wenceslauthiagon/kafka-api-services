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
import {
  ClaimReasonType,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  CancelingPortabilityClaimProcessController,
  CancelingPortabilityClaimProcessRequest,
  CancelingPortabilityClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class CancelingPortabilityClaimProcessRequestDto
  implements CancelingPortabilityClaimProcessRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: CancelingPortabilityClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type CancelingPortabilityClaimProcessResponseDto =
  CancelingPortabilityClaimProcessResponse;

export type CancelingPortabilityClaimProcessKafkaRequest =
  KafkaMessage<CancelingPortabilityClaimProcessRequestDto>;

export type CancelingPortabilityClaimProcessKafkaResponse =
  KafkaResponse<CancelingPortabilityClaimProcessResponseDto>;

/**
 * CancelingPortabilityClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class CancelingPortabilityClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of canceling portability process.
   *
   * @param pixKeyRepository User repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CANCELING_PORTABILITY_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(CancelingPortabilityClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelingPortabilityClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelingPortabilityClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelingPortabilityClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Canceling portability process.', { payload });

    // Create and call canceling portability process controller.
    const controller = new CancelingPortabilityClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
    );

    // Create and call canceling process.
    const pixKey = await controller.execute(payload);

    logger.info('Portability canceling process.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
