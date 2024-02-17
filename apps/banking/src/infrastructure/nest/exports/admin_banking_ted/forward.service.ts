import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ForwardAdminBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  ForwardAdminBankingTedRequest,
  ForwardAdminBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ADMIN_BANKING_TED.FORWARD;

/**
 * Forward adminBankingTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ForwardAdminBankingTedServiceKafka {
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
      context: ForwardAdminBankingTedServiceKafka.name,
    });
  }

  /**
   * Call banking microservice.
   * @param payload Data.
   */
  async execute(
    payload: ForwardAdminBankingTedRequest,
  ): Promise<ForwardAdminBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ForwardAdminBankingTedKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send adminBankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      ForwardAdminBankingTedResponse,
      ForwardAdminBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received adminBankingTed message.', { result });

    return result;
  }
}
