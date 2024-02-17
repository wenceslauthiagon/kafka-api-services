import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ConfirmBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  ConfirmBankingTedRequest,
  ConfirmBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED.CONFIRM;

/**
 * Confirm bankingTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ConfirmBankingTedServiceKafka {
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
      context: ConfirmBankingTedServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a bankingTed.
   * @param payload Data.
   */
  async execute(
    payload: ConfirmBankingTedRequest,
  ): Promise<ConfirmBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ConfirmBankingTedKafkaRequest = {
      key: `${payload.transactionId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      ConfirmBankingTedResponse,
      ConfirmBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bankingTed message.', { result });

    return result;
  }
}
