import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOrdersRefundsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetOrdersRefundsRequest,
  GetOrdersRefundsResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ORDER_REFUNDS.GET_ALL;

/**
 * Get orders refunds microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetOrdersRefundsServiceKafka {
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
      context: GetOrdersRefundsServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetOrdersRefunds.
   * @param payload Data.
   */
  async execute(
    payload: GetOrdersRefundsRequest,
  ): Promise<GetOrdersRefundsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetOrdersRefundsKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get orders refunds message.', { data });

    // Call GetOrdersRefunds microservice.
    const result = await this.kafkaService.send<
      GetOrdersRefundsResponse,
      GetOrdersRefundsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get orders refunds message.', { result });

    return result;
  }
}
