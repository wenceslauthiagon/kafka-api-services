import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllBankingContactKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetAllBankingContactRequest,
  GetAllBankingContactResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_CONTACT.GET_ALL;

/**
 * BankingContact microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllBankingContactServiceKafka {
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
      context: GetAllBankingContactServiceKafka.name,
    });
  }

  /**
   * Call BankingContact microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllBankingContactRequest,
  ): Promise<GetAllBankingContactResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllBankingContactKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send banking account message.');

    // Call BankingContacting microservice.
    const result = await this.kafkaService.send<
      GetAllBankingContactResponse,
      GetAllBankingContactKafkaRequest
    >(SERVICE, data);

    logger.debug('Received banking account message.', result);

    return result;
  }
}
