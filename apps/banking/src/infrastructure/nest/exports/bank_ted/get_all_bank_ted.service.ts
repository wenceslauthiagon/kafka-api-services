import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllBankTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetAllBankTedRequest,
  GetAllBankTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANK_TED.GET_ALL;

/**
 * BankTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllBankTedServiceKafka {
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
    this.logger = logger.child({ context: GetAllBankTedServiceKafka.name });
  }

  /**
   * Call bankTeds microservice to getAll.
   * @param payload Data.
   */
  async execute(payload: GetAllBankTedRequest): Promise<GetAllBankTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllBankTedKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send bankTed message.');

    // Call BankTeding microservice.
    const result = await this.kafkaService.send<
      GetAllBankTedResponse,
      GetAllBankTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bankTed message.', result);

    return result;
  }
}
