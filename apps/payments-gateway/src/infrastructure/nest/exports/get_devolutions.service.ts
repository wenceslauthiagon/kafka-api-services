import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetDevolutionsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetDevolutionsRequest,
  GetDevolutionsResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DEVOLUTION.GET_ALL;

/**
 * Get devolutions microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetDevolutionsServiceKafka {
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
      context: GetDevolutionsServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetDevolutions.
   * @param payload Data.
   */
  async execute(
    payload: GetDevolutionsRequest,
  ): Promise<GetDevolutionsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetDevolutionsKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get devolutions message.', { data });

    // Call GetDevolutions microservice.
    const result = await this.kafkaService.send<
      GetDevolutionsResponse,
      GetDevolutionsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get devolutions message.', { result });

    return result;
  }
}
