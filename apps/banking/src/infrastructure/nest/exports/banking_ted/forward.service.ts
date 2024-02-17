import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ForwardBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  ForwardBankingTedRequest,
  ForwardBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED.FORWARD;

/**
 * Forward bankingTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ForwardBankingTedServiceKafka {
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
      context: ForwardBankingTedServiceKafka.name,
    });
  }

  /**
   * Call banking microservice.
   * @param payload Data.
   */
  async execute(
    payload: ForwardBankingTedRequest,
  ): Promise<ForwardBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ForwardBankingTedKafkaRequest = {
      key: `${payload.id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      ForwardBankingTedResponse,
      ForwardBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bankingTed message.', { result });

    return result;
  }
}
