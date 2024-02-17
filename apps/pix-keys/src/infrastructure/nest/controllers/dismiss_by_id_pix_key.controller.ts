import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  InjectValidator,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  DismissByIdPixKeyController,
  DismissByIdPixKeyRequest,
  DismissByIdPixKeyResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class DismissByIdPixKeyRequestDto implements DismissByIdPixKeyRequest {
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  constructor(props: DismissByIdPixKeyRequest) {
    Object.assign(this, props);
  }
}

export type DismissByIdPixKeyResponseDto = DismissByIdPixKeyResponse;

export type DismissByIdPixKeyKafkaRequest =
  KafkaMessage<DismissByIdPixKeyRequestDto>;

export type DismissByIdPixKeyKafkaResponse =
  KafkaResponse<DismissByIdPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class DismissByIdPixKeyMicroserviceController {
  /**
   * Default pixKey RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of dismiss pixKey by id.
   *
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.DISMISS_BY_ID)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(DismissByIdPixKeyMicroserviceController)
    logger: Logger,
    @Payload('value') message: DismissByIdPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<DismissByIdPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DismissByIdPixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Dismiss pix key from user.', { userId: payload.userId });

    // Create and call dismiss pixKey by user and id controller.
    const controller = new DismissByIdPixKeyController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Dismiss pixKey
    const pixKey = await controller.execute(payload);

    logger.info('Pix key dismissed.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
