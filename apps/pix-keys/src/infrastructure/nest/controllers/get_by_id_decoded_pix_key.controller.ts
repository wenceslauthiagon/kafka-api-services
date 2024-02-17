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
import { DecodedPixKeyRepository } from '@zro/pix-keys/domain';
import {
  KAFKA_TOPICS,
  DecodedPixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import {
  GetByIdDecodedPixKeyRequest,
  GetByIdDecodedPixKeyResponse,
  GetByIdDecodedPixKeyController,
} from '@zro/pix-keys/interface';

export class GetByIdDecodedPixKeyRequestDto
  implements GetByIdDecodedPixKeyRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: GetByIdDecodedPixKeyRequest) {
    Object.assign(this, props);
  }
}

export type GetByIdDecodedPixKeyResponseDto = GetByIdDecodedPixKeyResponse;

export type GetByIdDecodedPixKeyKafkaRequest =
  KafkaMessage<GetByIdDecodedPixKeyRequestDto>;

export type GetByIdDecodedPixKeyKafkaResponse =
  KafkaResponse<GetByIdDecodedPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class GetByIdDecodedPixKeyMicroserviceController {
  /**
   * Default pixKey RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of verify decodedPixKey.
   *
   * @param decodedPixKeyRepository Decoded pix key repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DECODED_KEY.GET_BY_ID)
  async execute(
    @RepositoryParam(DecodedPixKeyDatabaseRepository)
    decodedPixKeyRepository: DecodedPixKeyRepository,
    @LoggerParam(GetByIdDecodedPixKeyMicroserviceController) logger: Logger,
    @Payload('value') message: GetByIdDecodedPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetByIdDecodedPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetByIdDecodedPixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Getting decoded pix key.', { payload });

    // Create and call get by id decoded pix key
    const controller = new GetByIdDecodedPixKeyController(
      logger,
      decodedPixKeyRepository,
    );

    // Get DecodedPixKey
    const decodedPixKey = await controller.execute(payload);

    logger.info('Decoded Pix Key found.', { decodedPixKey });

    return {
      ctx,
      value: decodedPixKey,
    };
  }
}
