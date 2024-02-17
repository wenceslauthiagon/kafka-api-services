import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CloseWarningTransactionKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import {
  CloseWarningTransactionRequest,
  CloseWarningTransactionResponse,
} from '@zro/compliance/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.WARNING_TRANSACTION.CLOSE;

/**
 * Service to call compliance microservice to close warning transaction.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class CloseWarningTransactionServiceKafka {
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
      context: CloseWarningTransactionServiceKafka.name,
    });
  }

  /**
   * Call compliance microservice to close a new warning transaction.
   * @param payload Data.
   */
  async execute(
    payload: CloseWarningTransactionRequest,
  ): Promise<CloseWarningTransactionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CloseWarningTransactionKafkaRequest = {
      key: `${payload.operationId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send close warning transaction request message.', { data });

    // Call close warning transaction microservice.
    const result = await this.kafkaService.send<
      CloseWarningTransactionResponse,
      CloseWarningTransactionKafkaRequest
    >(SERVICE, data);

    logger.debug('Received close warning transaction message.', { result });

    return result;
  }
}
