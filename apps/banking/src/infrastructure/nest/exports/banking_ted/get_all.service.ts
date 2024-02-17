import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetAllBankingTedRequest,
  GetAllBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED.GET_ALL;

/**
 * Get all bankingTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllBankingTedServiceKafka {
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
    this.logger = logger.child({ context: GetAllBankingTedServiceKafka.name });
  }

  /**
   * Call banking microservice to get all bankingTed.
   * @param payload Data.
   */
  async execute(
    payload: GetAllBankingTedRequest,
  ): Promise<GetAllBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllBankingTedKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      GetAllBankingTedResponse,
      GetAllBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bankingTed message.', { result });

    return result;
  }
}
