import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetBankingTedByOperationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetBankingTedByOperationRequest,
  GetBankingTedByOperationResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED.GET_BY_OPERATION;

/**
 * Get BankingTed by Operation microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetBankingTedByOperationServiceKafka {
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
      context: GetBankingTedByOperationServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a bankingTed.
   * @param payload Data.
   */
  async execute(
    payload: GetBankingTedByOperationRequest,
  ): Promise<GetBankingTedByOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetBankingTedByOperationKafkaRequest = {
      key: `${payload.operationId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Banking ted message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      GetBankingTedByOperationResponse,
      GetBankingTedByOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Banking ted message.', { result });

    return result;
  }
}
