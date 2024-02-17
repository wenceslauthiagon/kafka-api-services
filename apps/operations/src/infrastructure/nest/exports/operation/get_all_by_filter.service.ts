import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllOperationsByFilterKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllOperationsByFilterRequest,
  GetAllOperationsByFilterResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.OPERATION.GET_ALL_BY_FILTER;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllOperationsByFilterServiceKafka {
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
      context: GetAllOperationsByFilterServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to getAllByTransactionTypeAndDate.
   * @param payload Data.
   */
  async execute(
    payload: GetAllOperationsByFilterRequest,
  ): Promise<GetAllOperationsByFilterResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get operation by filter payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetAllOperationsByFilterKafkaRequest = {
      key: `${payload.transactionTag ?? payload.currencyTag}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      GetAllOperationsByFilterResponse,
      GetAllOperationsByFilterKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get operation by filter message.', {
      result,
    });

    return result;
  }
}
