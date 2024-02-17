import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
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
import { PixKeyReasonType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  DeleteByIdPixKeyController,
  DeleteByIdPixKeyRequest,
  DeleteByIdPixKeyResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';

export class DeleteByIdPixKeyRequestDto implements DeleteByIdPixKeyRequest {
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  @IsEnum(PixKeyReasonType)
  reason: PixKeyReasonType;

  constructor(props: DeleteByIdPixKeyRequest) {
    Object.assign(this, props);
  }
}

export type DeleteByIdPixKeyResponseDto = DeleteByIdPixKeyResponse;

export type DeleteByIdPixKeyKafkaRequest =
  KafkaMessage<DeleteByIdPixKeyRequestDto>;

export type DeleteByIdPixKeyKafkaResponse =
  KafkaResponse<DeleteByIdPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class DeleteByIdPixKeyMicroserviceController {
  /**
   * Default pixKey RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of verify pixKey code.
   *
   * @param pixKeyRepository Pix key repository.
   * @param pixKeyVerificationRepository Pix key verification repository.
   * @param eventEmitter Pix key event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.DELETE_BY_ID)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(DeleteByIdPixKeyMicroserviceController) logger: Logger,
    @Payload('value') message: DeleteByIdPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<DeleteByIdPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeleteByIdPixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Delete pix key from user.', { userId: payload.userId });

    // Create and call delete pixKey by user and id controller.
    const controller = new DeleteByIdPixKeyController(
      logger,
      pixKeyRepository,
      eventEmitter,
    );

    // Delete pixKey
    const pixKey = await controller.execute(payload);

    logger.info('Pix key deleted.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
