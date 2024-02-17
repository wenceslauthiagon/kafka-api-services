import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetDevolutionByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetTransactionByIdRequest,
  TransactionResponseItem,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DEVOLUTION.GET_BY_ID;

/**
 * Get devolution by id microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetDevolutionByIdServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetDevolutionByIdServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetDevolutionById.
   * @param payload Data.
   */
  async execute(
    payload: GetTransactionByIdRequest,
  ): Promise<TransactionResponseItem> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetDevolutionByIdKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get devolution by id message.', { data });

    // Call GetDevolutionById microservice.
    const result = await this.kafkaService.send<
      TransactionResponseItem,
      GetDevolutionByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get devolution by id message.', { result });

    return result;
  }
}
