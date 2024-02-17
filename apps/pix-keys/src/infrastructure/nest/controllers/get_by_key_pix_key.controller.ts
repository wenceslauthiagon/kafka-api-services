import { IsString } from 'class-validator';
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
  GetByKeyPixKeyRequest,
  GetByKeyPixKeyResponse,
  GetByKeyPixKeyController,
} from '@zro/pix-keys/interface';

export class GetByKeyPixKeyRequestDto implements GetByKeyPixKeyRequest {
  @IsString()
  key: string;

  constructor(props: GetByKeyPixKeyRequest) {
    Object.assign(this, props);
  }
}

export type GetByKeyPixKeyResponseDto = GetByKeyPixKeyResponse;

export type GetByKeyPixKeyKafkaRequest = KafkaMessage<GetByKeyPixKeyRequestDto>;

export type GetByKeyPixKeyKafkaResponse =
  KafkaResponse<GetByKeyPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class GetByKeyPixKeyMicroserviceController {
  /**
   * Default pixKey RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of get key pix.
   *
   * @param pixKeyRepository Pix key repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.GET_BY_KEY)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @LoggerParam(GetByKeyPixKeyMicroserviceController) logger: Logger,
    @Payload('value') message: GetByKeyPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetByKeyPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetByKeyPixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Getting pix key from key.', { payload });

    // Create and call get pixKey by key.
    const controller = new GetByKeyPixKeyController(logger, pixKeyRepository);

    // Get pixKey
    const pixKey = await controller.execute(payload);

    logger.info('Pix key found.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
