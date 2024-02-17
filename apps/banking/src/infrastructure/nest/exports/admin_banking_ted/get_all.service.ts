import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllAdminBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetAllAdminBankingTedRequest,
  GetAllAdminBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ADMIN_BANKING_TED.GET_ALL;

/**
 * Get admin banking teds microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllAdminBankingTedServiceKafka {
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
      context: GetAllAdminBankingTedServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get admin banking teds.
   * @param payload Data.
   */
  async execute(
    payload: GetAllAdminBankingTedRequest,
  ): Promise<GetAllAdminBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllAdminBankingTedKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send adminBankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      GetAllAdminBankingTedResponse,
      GetAllAdminBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received adminBankingTed message.', { result });

    return result;
  }
}
