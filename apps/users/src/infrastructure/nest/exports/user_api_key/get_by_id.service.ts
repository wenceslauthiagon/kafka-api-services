import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserApiKeyByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';
import {
  GetUserApiKeyByIdRequest,
  GetUserApiKeyByIdResponse,
} from '@zro/users/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.USER_API_KEY.GET_BY_ID;

/**
 * Service to call get by id at users microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserApiKeyByIdServiceKafka {
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
      context: GetUserApiKeyByIdServiceKafka.name,
    });
  }

  /**
   * Call get user api key by id microservice.
   * @param Id The user's Id.
   * @returns User if found or null otherwise.
   */
  async execute(
    request: GetUserApiKeyByIdRequest,
  ): Promise<GetUserApiKeyByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Create request Kafka message.
    const data: GetUserApiKeyByIdKafkaRequest = {
      key: `${request.id}`,
      headers: { requestId: this.requestId },
      value: request,
    };

    logger.debug('Get user api key by id message.', { data });

    // Call get user api key by id microservice.
    const result = await this.kafkaService.send<
      GetUserApiKeyByIdResponse,
      GetUserApiKeyByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received user api key message.', {
      result,
    });

    return result;
  }
}
