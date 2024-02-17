import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DeleteBankingAccountContactKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import { DeleteBankingAccountContactRequest } from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_CONTACT.DELETE_BY_ID_AND_USER;

/**
 * BankingAccountContact microservice.
 */
@KafkaSubscribeService(SERVICE)
export class DeleteBankingAccountContactServiceKafka {
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
      context: DeleteBankingAccountContactServiceKafka.name,
    });
  }

  /**
   * Call BankingAccountContact microservice to delete.
   * @param payload Data.
   */
  async execute(payload: DeleteBankingAccountContactRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: DeleteBankingAccountContactKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send banking account message.');

    // Call BankingAccountContacting microservice.
    const result = await this.kafkaService.send<
      void,
      DeleteBankingAccountContactKafkaRequest
    >(SERVICE, data);

    logger.debug('Received banking account message.', result);

    return result;
  }
}
