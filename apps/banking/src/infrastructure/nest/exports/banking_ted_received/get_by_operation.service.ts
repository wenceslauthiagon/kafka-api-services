import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetBankingTedReceivedByOperationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetBankingTedReceivedByOperationRequest,
  GetBankingTedReceivedByOperationResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED_RECEIVED.GET_BY_OPERATION;

/**
 * Get BankingTedReceived by Operation microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetBankingTedReceivedByOperationServiceKafka {
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
      context: GetBankingTedReceivedByOperationServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a bankingTedReceived.
   * @param payload Data.
   */
  async execute(
    payload: GetBankingTedReceivedByOperationRequest,
  ): Promise<GetBankingTedReceivedByOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetBankingTedReceivedByOperationKafkaRequest = {
      key: `${payload.operationId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send BankingTedReceived message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      GetBankingTedReceivedByOperationResponse,
      GetBankingTedReceivedByOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received BankingTedReceived message.', { result });

    return result;
  }
}
