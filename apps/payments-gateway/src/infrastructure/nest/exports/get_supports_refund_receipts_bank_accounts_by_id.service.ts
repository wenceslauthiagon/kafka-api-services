import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetRefundReceiptsBankAccountsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetRefundReceiptsBankAccountsRequest,
  GetRefundReceiptsBankAccountsResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.SUPPORTS.REFUND;

/**
 * Get supports refund receipts bank accounts microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetSupportsRefundReceiptsBankAccountsServiceKafka {
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
      context: GetSupportsRefundReceiptsBankAccountsServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetSupportsRefundReceiptsBankAccounts.
   * @param payload Data.
   */
  async execute(
    payload: GetRefundReceiptsBankAccountsRequest,
  ): Promise<GetRefundReceiptsBankAccountsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetRefundReceiptsBankAccountsKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get refund receipts bank accounts message.', { data });

    // Call GetRefundReceiptsBankAccounts microservice.
    const result = await this.kafkaService.send<
      GetRefundReceiptsBankAccountsResponse,
      GetRefundReceiptsBankAccountsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get refund receipts bank accounts message.', {
      result,
    });

    return result;
  }
}
