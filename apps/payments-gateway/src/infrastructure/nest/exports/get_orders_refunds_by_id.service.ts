import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOrderRefundsByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetOrderRefundsByIdResponse,
  GetOrderRefundsByIdRequest,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ORDER_REFUNDS.GET_BY_ID;

/**
 * Get orders refunds by id microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetOrdersRefundsByIdServiceKafka {
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
      context: GetOrdersRefundsByIdServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetOrdersRefundsById.
   * @param payload Data.
   */
  async execute(
    payload: GetOrderRefundsByIdRequest,
  ): Promise<GetOrderRefundsByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetOrderRefundsByIdKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get orders refunds by id message.', { data });

    // Call GetOrdersRefundsById microservice.
    const result = await this.kafkaService.send<
      GetOrderRefundsByIdResponse,
      GetOrderRefundsByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get orders refunds by id message.', { result });

    return result;
  }
}
