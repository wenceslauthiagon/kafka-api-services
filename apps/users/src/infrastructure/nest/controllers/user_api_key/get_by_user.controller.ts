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
  GetUserApiKeyByUserController,
  GetUserApiKeyByUserRequest,
  GetUserApiKeyByUserResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserApiKeyDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetUserApiKeyByUserKafkaRequest =
  KafkaMessage<GetUserApiKeyByUserRequest>;
export type GetUserApiKeyByUserKafkaResponse =
  KafkaResponse<GetUserApiKeyByUserResponse>;

/**
 * UserApiKey controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetUserApiKeyByUserMicroserviceController {
  /**
   * Consumer of get by user.
   *
   * @param userApiKeyRepository UserApiKey repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_API_KEY.GET_BY_USER)
  async execute(
    @RepositoryParam(UserApiKeyDatabaseRepository)
    userApiKeyRepository: UserApiKeyRepository,
    @LoggerParam(GetUserApiKeyByUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserApiKeyByUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserApiKeyByUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserApiKeyByUserRequest(message);

    // Create and call get by id controller.
    const controller = new GetUserApiKeyByUserController(
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
