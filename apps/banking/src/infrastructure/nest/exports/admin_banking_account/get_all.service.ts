import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllAdminBankingAccountKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetAllAdminBankingAccountRequest,
  GetAllAdminBankingAccountResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ADMIN_BANKING_ACCOUNT.GET_ALL;

/**
 * Get admin banking accounts microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllAdminBankingAccountServiceKafka {
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
      context: GetAllAdminBankingAccountServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get admin banking account.
   * @param payload Data.
   */
  async execute(
    payload: GetAllAdminBankingAccountRequest,
  ): Promise<GetAllAdminBankingAccountResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllAdminBankingAccountKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send adminBankingAccount message.', { data });

    // Call get banking account microservice.
    const result = await this.kafkaService.send<
      GetAllAdminBankingAccountResponse,
      GetAllAdminBankingAccountKafkaRequest
    >(SERVICE, data);

    logger.debug('Received adminBankingAccount message.', { result });

    return result;
  }
}
