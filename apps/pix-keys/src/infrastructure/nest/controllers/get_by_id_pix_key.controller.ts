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
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import {
  GetByIdPixKeyRequest,
  GetByIdPixKeyResponse,
  GetByIdPixKeyController,
} from '@zro/pix-keys/interface';

export class GetByIdPixKeyRequestDto implements GetByIdPixKeyRequest {
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  id: string;

  constructor(props: GetByIdPixKeyRequest) {
    Object.assign(this, props);
  }
}

export type GetByIdPixKeyResponseDto = GetByIdPixKeyResponse;

export type GetByIdPixKeyKafkaRequest = KafkaMessage<GetByIdPixKeyRequestDto>;

export type GetByIdPixKeyKafkaResponse =
  KafkaResponse<GetByIdPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class GetByIdPixKeyMicroserviceController {
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
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.GET_BY_ID)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @LoggerParam(GetByIdPixKeyMicroserviceController) logger: Logger,
    @Payload('value') message: GetByIdPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetByIdPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetByIdPixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Getting pix key from user.', { userId: payload.userId });

    // Create and call get pixKey by user and id controller.
    const controller = new GetByIdPixKeyController(logger, pixKeyRepository);

    // Get pixKey
    const pixKey = await controller.execute(payload);

    logger.info('Pix key found.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
