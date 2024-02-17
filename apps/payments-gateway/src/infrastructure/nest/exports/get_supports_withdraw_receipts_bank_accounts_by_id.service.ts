import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWithdrawReceiptsBankAccountsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetWithdrawReceiptsBankAccountsRequest,
  GetWithdrawReceiptsBankAccountsResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.SUPPORTS.WITHDRAW;

/**
 * Get supports withdraw receipts bank accounts microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetSupportsWithdrawReceiptsBankAccountsServiceKafka {
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
      context: GetSupportsWithdrawReceiptsBankAccountsServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetSupportsWithdrawReceiptsBankAccounts.
   * @param payload Data.
   */
  async execute(
    payload: GetWithdrawReceiptsBankAccountsRequest,
  ): Promise<GetWithdrawReceiptsBankAccountsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetWithdrawReceiptsBankAccountsKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get withdraw receipts bank accounts message.', { data });

    // Call GetWithdrawReceiptsBankAccounts microservice.
    const result = await this.kafkaService.send<
      GetWithdrawReceiptsBankAccountsResponse,
      GetWithdrawReceiptsBankAccountsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get withdraw receipts bank accounts message.', {
      result,
    });

    return result;
  }
}
