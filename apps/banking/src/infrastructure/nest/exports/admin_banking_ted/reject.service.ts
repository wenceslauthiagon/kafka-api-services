import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  RejectAdminBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  RejectAdminBankingTedRequest,
  RejectAdminBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ADMIN_BANKING_TED.REJECT;

/**
 * Reject adminBankingTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class RejectAdminBankingTedServiceKafka {
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
      context: RejectAdminBankingTedServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a adminBankingTed.
   * @param payload Data.
   */
  async execute(
    payload: RejectAdminBankingTedRequest,
  ): Promise<RejectAdminBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: RejectAdminBankingTedKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send adminBankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      RejectAdminBankingTedResponse,
      RejectAdminBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received adminBankingTed message.', { result });

    return result;
  }
}
