import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOrdersKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetOrdersRequest,
  GetOrdersResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ORDER.GET_ALL;

/**
 * Get orders microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetOrdersServiceKafka {
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
      context: GetOrdersServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetOrders.
   * @param payload Data.
   */
  async execute(payload: GetOrdersRequest): Promise<GetOrdersResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetOrdersKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get orders message.', { data });

    // Call GetOrders microservice.
    const result = await this.kafkaService.send<
      GetOrdersResponse,
      GetOrdersKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get orders message.', { result });

    return result;
  }
}
