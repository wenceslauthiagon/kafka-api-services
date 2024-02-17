import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import {
  GetPixKeyByKeyAndUserRequest,
  GetPixKeyByKeyAndUserResponse,
  GetPixKeyByKeyAndUserController,
} from '@zro/pix-keys/interface';

export type GetPixKeyByKeyAndUserKafkaRequest =
  KafkaMessage<GetPixKeyByKeyAndUserRequest>;

export type GetPixKeyByKeyAndUserKafkaResponse =
  KafkaResponse<GetPixKeyByKeyAndUserResponse>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class GetPixKeyByKeyAndUserMicroserviceController {
  /**
   * Consumer of get key pix by key and user.
   * @param pixKeyRepository Pix key repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.GET_BY_KEY_AND_USER)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @LoggerParam(GetPixKeyByKeyAndUserMicroserviceController) logger: Logger,
    @Payload('value') message: GetPixKeyByKeyAndUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPixKeyByKeyAndUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPixKeyByKeyAndUserRequest(message);

    logger.info('Getting pix key from key and user.', { payload });

    // Create and call get pixKey by key.
    const controller = new GetPixKeyByKeyAndUserController(
      logger,
      pixKeyRepository,
    );

    // Get pixKey
    const pixKey = await controller.execute(payload);

    logger.info('Pix key found.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
