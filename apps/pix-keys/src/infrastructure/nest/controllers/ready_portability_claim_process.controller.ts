import { Logger } from 'winston';
import { IsString } from 'class-validator';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  ReadyPortabilityClaimProcessController,
  ReadyPortabilityClaimProcessRequest,
  ReadyPortabilityClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyClaimDatabaseRepository,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class ReadyPortabilityClaimProcessRequestDto
  implements ReadyPortabilityClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: ReadyPortabilityClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type ReadyPortabilityClaimProcessResponseDto =
  ReadyPortabilityClaimProcessResponse;

export type ReadyPortabilityClaimProcessKafkaRequest =
  KafkaMessage<ReadyPortabilityClaimProcessRequestDto>;

export type ReadyPortabilityClaimProcessKafkaResponse =
  KafkaResponse<ReadyPortabilityClaimProcessResponseDto>;

interface ReadyPortabilityClaimProcessConfig {
  APP_PIX_KEY_ENABLE_AUTO_APPROVE_PORTABILITY_REQUEST: boolean;
}

/**
 * ReadyPortabilityClaimProcess controller.
 */
@Controller()
@MicroserviceController()
export class ReadyPortabilityClaimProcessMicroserviceController {
  /**
   * Enable all portability request to be approved without waiting for user answer.
   * Default value is 'true'.
   */
  private readonly autoApprovePortabilityRequestEnabled: boolean;

  /**
   * Default controller constructor.
   */
  constructor(
    @InjectValidator() private validate: Validator,
    configService: ConfigService<ReadyPortabilityClaimProcessConfig>,
  ) {
    this.autoApprovePortabilityRequestEnabled =
      'true' ===
      configService.get<string>(
        'APP_PIX_KEY_ENABLE_AUTO_APPROVE_PORTABILITY_REQUEST',
        'true',
      );
  }

  /**
   * Consumer of ready portability process.
   *
   * @param pixKeyRepository PixKey repository.
   * @param pixKeyClaimRepository PixKeyClaim repository.
   * @param logger Logger instance.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.READY_PORTABILITY_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ReadyPortabilityClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: ReadyPortabilityClaimProcessRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ReadyPortabilityClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ReadyPortabilityClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Ready portability process.', { payload });

    // Create and call ready portability process controller.
    const controller = new ReadyPortabilityClaimProcessController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      eventEmitter,
      this.autoApprovePortabilityRequestEnabled,
    );

    // Create and call ready process.
    const pixKey = await controller.execute(payload);

    logger.info('Portability process ready.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
