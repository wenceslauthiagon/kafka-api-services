import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaService } from '@zro/common';
import {
  KAFKA_EVENTS,
  HandleReprocessPixStatementEventKafkaRequest,
} from '@zro/api-topazio/infrastructure';
import { HandleReprocessPixStatementEventRequest } from '@zro/api-topazio/interface';

// Event topic.
const EVENT = KAFKA_EVENTS.TOPAZIO.REPROCESS_PIX_STATEMENT;

/**
 * Reprocess Pix Statement microservice.
 */
@KafkaCreateEvent([EVENT])
export class ReprocessPixStatementServiceKafka {
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
      context: ReprocessPixStatementServiceKafka.name,
    });
  }

  /**
   * Call banks microservice to create a adminBankingTed.
   * @param payload Data.
   */
  async execute(
    payload: HandleReprocessPixStatementEventRequest,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: HandleReprocessPixStatementEventKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send reprocess pix statement message.', { data });

    // Call ReprocessPixStatement microservice.
    const result =
      await this.kafkaService.emit<HandleReprocessPixStatementEventKafkaRequest>(
        EVENT,
        data,
      );

    logger.debug('Sent reprocess pix statement message message.', { result });
  }
}
