import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAdminBankingTedByTransactionIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetAdminBankingTedByTransactionIdRequest,
  GetAdminBankingTedByTransactionIdResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ADMIN_BANKING_TED.GET_BY_TRANSACTION_ID;

/**
 * Get adminBankingTed by transactionId microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAdminBankingTedByTransactionIdServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetAdminBankingTedByTransactionIdServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a adminBankingTed.
   * @param payload Data.
   */
  async execute(
    payload: GetAdminBankingTedByTransactionIdRequest,
  ): Promise<GetAdminBankingTedByTransactionIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAdminBankingTedByTransactionIdKafkaRequest = {
      key: `${payload.transactionId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send adminBankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      GetAdminBankingTedByTransactionIdResponse,
      GetAdminBankingTedByTransactionIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received adminBankingTed message.', { result });

    return result;
  }
}
