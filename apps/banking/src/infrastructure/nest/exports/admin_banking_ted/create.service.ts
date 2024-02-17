import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateAdminBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  CreateAdminBankingTedRequest,
  CreateAdminBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ADMIN_BANKING_TED.CREATE;

/**
 * Create adminBankingTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateAdminBankingTedServiceKafka {
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
      context: CreateAdminBankingTedServiceKafka.name,
    });
  }

  /**
   * Call banks microservice to create a adminBankingTed.
   * @param payload Data.
   */
  async execute(
    payload: CreateAdminBankingTedRequest,
  ): Promise<CreateAdminBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateAdminBankingTedKafkaRequest = {
      key: `${payload.adminId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send adminBankingTed message.', { data });

    // Call create banking microservice.
    const result = await this.kafkaService.send<
      CreateAdminBankingTedResponse,
      CreateAdminBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received adminBankingTed message.', { result });

    return result;
  }
}
