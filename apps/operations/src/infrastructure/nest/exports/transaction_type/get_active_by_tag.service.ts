import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetActiveTransactionTypeByTagKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetActiveTransactionTypeByTagRequest,
  GetActiveTransactionTypeByTagResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.TRANSACTION_TYPE.GET_ACTIVE_BY_TAG;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetActiveTransactionTypeByTagServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetActiveTransactionTypeByTagServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get active transaction type by tag.
   * @param payload Data.
   * @returns User limit.
   */
  async execute(
    payload: GetActiveTransactionTypeByTagRequest,
  ): Promise<GetActiveTransactionTypeByTagResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get active transaction type by tag message.', {
      payload,
    });

    // Request Kafka message.
    const data: GetActiveTransactionTypeByTagKafkaRequest = {
      key: `${payload.tag}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operations microservice.
    const result = await this.kafkaService.send<
      GetActiveTransactionTypeByTagResponse,
      GetActiveTransactionTypeByTagKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get active transaction type by tag message.', {
      result,
    });

    return result;
  }
}
