import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetRefundByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetTransactionByIdRequest,
  TransactionResponseItem,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.REFUND.GET_BY_ID;

/**
 * Get refund by id microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetRefundByIdServiceKafka {
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
      context: GetRefundByIdServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetRefundById.
   * @param payload Data.
   */
  async execute(
    payload: GetTransactionByIdRequest,
  ): Promise<TransactionResponseItem> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetRefundByIdKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get refund by id message.', { data });

    // Call GetRefundById microservice.
    const result = await this.kafkaService.send<
      TransactionResponseItem,
      GetRefundByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get refund by id message.', { result });

    return result;
  }
}
