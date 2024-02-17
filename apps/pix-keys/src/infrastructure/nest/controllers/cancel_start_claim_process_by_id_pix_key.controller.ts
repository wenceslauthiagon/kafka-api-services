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
  CancelStartClaimProcessByIdPixKeyController,
  CancelStartClaimProcessByIdPixKeyRequest,
  CancelStartClaimProcessByIdPixKeyResponse,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';

export class CancelStartClaimProcessByIdPixKeyRequestDto
  implements CancelStartClaimProcessByIdPixKeyRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  constructor(props: CancelStartClaimProcessByIdPixKeyRequest) {
    Object.assign(this, props);
  }
}

export type CancelStartClaimProcessByIdPixKeyResponseDto =
  CancelStartClaimProcessByIdPixKeyResponse;

export type CancelStartClaimProcessByIdPixKeyKafkaRequest =
  KafkaMessage<CancelStartClaimProcessByIdPixKeyRequestDto>;

export type CancelStartClaimProcessByIdPixKeyKafkaResponse =
  KafkaResponse<CancelStartClaimProcessByIdPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class CancelStartClaimProcessByIdPixKeyMicroserviceController {
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
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CANCEL_START_CLAIM_PROCESS_BY_ID)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @LoggerParam(CancelStartClaimProcessByIdPixKeyMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelStartClaimProcessByIdPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelStartClaimProcessByIdPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelStartClaimProcessByIdPixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Cancel start claim process from user.', { payload });

    // Create and call cancel process of pixKey by user and id controller.
    const controller = new CancelStartClaimProcessByIdPixKeyController(
      logger,
      pixKeyRepository,
    );

    // Cancel start claim process of pixKey
    const pixKey = await controller.execute(payload);

    logger.info('Pix key updated.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
