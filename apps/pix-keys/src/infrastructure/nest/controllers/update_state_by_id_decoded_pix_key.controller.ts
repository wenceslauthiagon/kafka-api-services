import { IsEnum, IsUUID } from 'class-validator';
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
  EventEmitterParam,
} from '@zro/common';
import {
  DecodedPixKeyRepository,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import {
  KAFKA_TOPICS,
  DecodedPixKeyDatabaseRepository,
  DecodedPixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';
import {
  UpdateStateByIdDecodedPixKeyRequest,
  UpdateStateByIdDecodedPixKeyResponse,
  UpdateStateByIdDecodedPixKeyController,
  DecodedPixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export class UpdateStateByIdDecodedPixKeyRequestDto
  implements UpdateStateByIdDecodedPixKeyRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(DecodedPixKeyState)
  state: DecodedPixKeyState;

  constructor(props: UpdateStateByIdDecodedPixKeyRequest) {
    Object.assign(this, props);
  }
}

export type UpdateStateByIdDecodedPixKeyResponseDto =
  UpdateStateByIdDecodedPixKeyResponse;

export type UpdateStateByIdDecodedPixKeyKafkaRequest =
  KafkaMessage<UpdateStateByIdDecodedPixKeyRequestDto>;

export type UpdateStateByIdDecodedPixKeyKafkaResponse =
  KafkaResponse<UpdateStateByIdDecodedPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class UpdateStateByIdDecodedPixKeyMicroserviceController {
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
  @KafkaMessagePattern(KAFKA_TOPICS.DECODED_KEY.UPDATE_STATE_BY_ID)
  async execute(
    @RepositoryParam(DecodedPixKeyDatabaseRepository)
    decodedPixKeyRepository: DecodedPixKeyRepository,
    @EventEmitterParam(DecodedPixKeyEventKafkaEmitter)
    decodedPixKeyEmitter: DecodedPixKeyEventEmitterControllerInterface,
    @LoggerParam(UpdateStateByIdDecodedPixKeyMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateStateByIdDecodedPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateStateByIdDecodedPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateStateByIdDecodedPixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Update state by decoded pix key.', { payload });

    // Create and call update state by id decoded pix key
    const controller = new UpdateStateByIdDecodedPixKeyController(
      logger,
      decodedPixKeyRepository,
      decodedPixKeyEmitter,
    );

    // UpdateState decodedPixKey
    const decodedPixKey = await controller.execute(payload);

    logger.info('Decoded Pix Key updated.', { decodedPixKey });

    return {
      ctx,
      value: decodedPixKey,
    };
  }
}
