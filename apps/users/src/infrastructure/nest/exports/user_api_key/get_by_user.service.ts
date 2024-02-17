import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserApiKeyByUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetUserApiKeyByUserRequest,
  GetUserApiKeyByUserResponse,
} from '@zro/users/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_API_KEY.GET_BY_USER;

/**
 * Service to call get by user at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserApiKeyByUserServiceKafka {
  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetUserApiKeyByUserServiceKafka.name,
    });
  }

  /**
   * Call get user api key by user microservice.
   * @param User The user.
   * @returns User api key if found or null otherwise.
   */
  async execute(
    request: GetUserApiKeyByUserRequest,
  ): Promise<GetUserApiKeyByUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Create request Kafka message.
    const data: GetUserApiKeyByUserKafkaRequest = {
      key: `${request.userId}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    logger.debug('Get user api key by user message.', { data });

    // Call get user api key by user microservice.
    const result = await this.kafkaService.send<
      GetUserApiKeyByUserResponse,
      GetUserApiKeyByUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Received user api key message.', {
      result,
    });

    return result;
  }
}
