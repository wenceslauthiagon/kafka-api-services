import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  RejectBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  RejectBankingTedRequest,
  RejectBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED.REJECT;

/**
 * Reject bankingTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class RejectBankingTedServiceKafka {
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
      context: RejectBankingTedServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a bankingTed.
   * @param payload Data.
   */
  async execute(
    payload: RejectBankingTedRequest,
  ): Promise<RejectBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: RejectBankingTedKafkaRequest = {
      key: `${payload.id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      RejectBankingTedResponse,
      RejectBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bankingTed message.', { result });

    return result;
  }
}
