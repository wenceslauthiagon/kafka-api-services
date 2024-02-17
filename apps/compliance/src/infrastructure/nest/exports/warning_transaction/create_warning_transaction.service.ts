import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateWarningTransactionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import {
  CreateWarningTransactionRequest,
  CreateWarningTransactionResponse,
} from '@zro/compliance/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.WARNING_TRANSACTION.CREATE;

/**
 * Service to call compliance microservice to create warning transaction.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class CreateWarningTransactionServiceKafka {
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
      context: CreateWarningTransactionServiceKafka.name,
    });
  }

  /**
   * Call compliance microservice to create a warning transaction.
   * @param payload Data.
   */
  async execute(
    payload: CreateWarningTransactionRequest,
  ): Promise<CreateWarningTransactionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateWarningTransactionKafkaRequest = {
      key: `${payload.operationId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send create warning transaction request message', { data });

    // Call create warning transaction microservice
    const result = await this.kafkaService.send<
      CreateWarningTransactionResponse,
      CreateWarningTransactionKafkaRequest
    >(SERVICE, data);

    logger.debug('Received create warning transaction message.', { result });

    return result;
  }
}
