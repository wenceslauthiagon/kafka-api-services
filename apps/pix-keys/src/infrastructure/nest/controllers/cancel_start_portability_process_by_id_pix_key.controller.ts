import { IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  InjectValidator,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  CancelStartPortabilityProcessByIdPixKeyController,
  CancelStartPortabilityProcessByIdPixKeyRequest,
  CancelStartPortabilityProcessByIdPixKeyResponse,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';

export class CancelStartPortabilityProcessByIdPixKeyRequestDto
  implements CancelStartPortabilityProcessByIdPixKeyRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  constructor(props: CancelStartPortabilityProcessByIdPixKeyRequest) {
    Object.assign(this, props);
  }
}

export type CancelStartPortabilityProcessByIdPixKeyResponseDto =
  CancelStartPortabilityProcessByIdPixKeyResponse;

export type CancelStartPortabilityProcessByIdPixKeyKafkaRequest =
  KafkaMessage<CancelStartPortabilityProcessByIdPixKeyRequestDto>;

export type CancelStartPortabilityProcessByIdPixKeyKafkaResponse =
  KafkaResponse<CancelStartPortabilityProcessByIdPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class CancelStartPortabilityProcessByIdPixKeyMicroserviceController {
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
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CANCEL_START_PORTABILITY_PROCESS_BY_ID)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @LoggerParam(CancelStartPortabilityProcessByIdPixKeyMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelStartPortabilityProcessByIdPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelStartPortabilityProcessByIdPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelStartPortabilityProcessByIdPixKeyRequestDto(
      message,
    );
    await this.validate(payload);

    logger.info('Cancel start portability process from user.', { payload });

    // Create and call cancel process pixKey by user and id controller.
    const controller = new CancelStartPortabilityProcessByIdPixKeyController(
      logger,
      pixKeyRepository,
    );

    // Cancel start portability process of pixKey
    const pixKey = await controller.execute(payload);

    logger.info('Pix key updated.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
