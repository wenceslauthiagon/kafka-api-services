import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CancelTransactionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import {
  CancelTransactionRequest,
  CancelTransactionResponse,
} from '@zro/cielo/interface';
import { Logger } from 'winston';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.REFUND;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelTransactionCieloServiceKafka {
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
      context: CancelTransactionCieloServiceKafka.name,
    });
  }

  /**
   * Call cielo microservice to cancel or refound a transaction.
   * @param payload Data.
   */
  async execute(
    payload: CancelTransactionRequest,
  ): Promise<CancelTransactionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelTransactionKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Cielo cancel/refund message.', { data });

    // Call cancel/refund payment message.
    const result = await this.kafkaService.send<
      CancelTransactionResponse,
      CancelTransactionKafkaRequest
    >(SERVICE, data);

    logger.debug('Created cancel/refund message.', result);

    return result;
  }
}
