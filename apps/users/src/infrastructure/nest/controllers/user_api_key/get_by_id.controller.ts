import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserApiKeyRepository } from '@zro/users/domain';
import {
  GetUserApiKeyByIdController,
  GetUserApiKeyByIdRequest,
  GetUserApiKeyByIdResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserApiKeyDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetUserApiKeyByIdKafkaRequest =
  KafkaMessage<GetUserApiKeyByIdRequest>;
export type GetUserApiKeyByIdKafkaResponse =
  KafkaResponse<GetUserApiKeyByIdResponse>;

/**
 * UserApiKey controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetUserApiKeyByIdMicroserviceController {
  /**
   * Consumer of get by id.
   *
   * @param userApiKeyRepository UserApiKey repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_API_KEY.GET_BY_ID)
  async execute(
    @RepositoryParam(UserApiKeyDatabaseRepository)
    userApiKeyRepository: UserApiKeyRepository,
    @LoggerParam(GetUserApiKeyByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserApiKeyByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserApiKeyByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserApiKeyByIdRequest(message);

    // Create and call get by id controller.
    const controller = new GetUserApiKeyByIdController(
      logger,
      userApiKeyRepository,
    );

    const userApiKey = await controller.execute(payload);

    logger.info('User api key found.');

    return {
      ctx,
      value: userApiKey,
    };
  }
}
