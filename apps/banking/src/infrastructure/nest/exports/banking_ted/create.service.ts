import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateBankingTedKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  CreateBankingTedRequest,
  CreateBankingTedResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANKING_TED.CREATE;

/**
 * Create bankingTed microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateBankingTedServiceKafka {
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
    this.logger = logger.child({ context: CreateBankingTedServiceKafka.name });
  }

  /**
   * Call banks microservice to create a bankingTed.
   * @param payload Data.
   */
  async execute(
    payload: CreateBankingTedRequest,
  ): Promise<CreateBankingTedResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateBankingTedKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bankingTed message.', { data });

    // Call create banking microservice.
    const result = await this.kafkaService.send<
      CreateBankingTedResponse,
      CreateBankingTedKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bankingTed message.', { result });

    return result;
  }
}
