import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPixKeyByKeyAndUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  GetPixKeyByKeyAndUserRequest,
  GetPixKeyByKeyAndUserResponse,
} from '@zro/pix-keys/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.KEY.GET_BY_KEY_AND_USER;

/**
 * Get pix key by key and user microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPixKeyByKeyAndUserServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetPixKeyByKeyAndUserServiceKafka.name,
    });
  }

  /**
   * Call pix key microservice to get by key and user.
   * @param payload Data.
   */
  async execute(
    payload: GetPixKeyByKeyAndUserRequest,
  ): Promise<GetPixKeyByKeyAndUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPixKeyByKeyAndUserKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get pixKey by key and user message.', { data });

    // Call pix key microservice.
    const result = await this.kafkaService.send<
      GetPixKeyByKeyAndUserResponse,
      GetPixKeyByKeyAndUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pix key message.', { result });

    return result;
  }
}
