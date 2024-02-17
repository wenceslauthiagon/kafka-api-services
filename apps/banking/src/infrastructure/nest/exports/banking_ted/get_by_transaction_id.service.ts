import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetBankingTedByTransactionIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetBankingTedByTransactionIdRequest,
  GetBankingTedByTransactionIdResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED.GET_BY_TRANSACTION_ID;

/**
 * Get bankingTed by transactionId microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetBankingTedByTransactionIdServiceKafka {
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
      context: GetBankingTedByTransactionIdServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a bankingTed.
   * @param payload Data.
   */
  async execute(
    payload: GetBankingTedByTransactionIdRequest,
  ): Promise<GetBankingTedByTransactionIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetBankingTedByTransactionIdKafkaRequest = {
      key: `${payload.transactionId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      GetBankingTedByTransactionIdResponse,
      GetBankingTedByTransactionIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bankingTed message.', { result });

    return result;
  }
}
