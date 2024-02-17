import { Logger } from 'winston';
import { IsString } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
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
  WaitPortabilityClaimProcessController,
  WaitPortabilityClaimProcessRequest,
  WaitPortabilityClaimProcessResponse,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';

export class WaitPortabilityClaimProcessRequestDto
  implements WaitPortabilityClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: WaitPortabilityClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type WaitPortabilityClaimProcessResponseDto =
  WaitPortabilityClaimProcessResponse;

export type WaitPortabilityClaimProcessKafkaRequest =
  KafkaMessage<WaitPortabilityClaimProcessRequestDto>;

export type WaitPortabilityClaimProcessKafkaResponse =
  KafkaResponse<WaitPortabilityClaimProcessResponseDto>;

/**
 * WaitPortabilityClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class WaitPortabilityClaimProcessMicroserviceController {
  /**
   * Default controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of wait portability process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param pixKeyClaimRepository Pix Key Claim repository.
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
    @LoggerParam(WaitPortabilityClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: WaitPortabilityClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<WaitPortabilityClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new WaitPortabilityClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Wait portability process.', { payload });

    // Create and call wait portability process controller.
    const controller = new WaitPortabilityClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
    );

    // Create and call wait process.
    const pixKey = await controller.execute(payload);

    logger.info('Portability process wait.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
