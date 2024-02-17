import { Logger } from 'winston';
import { KafkaService, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS, PushRetryKafkaRequest } from '@zro/utils/infrastructure';
import { PushRetryRequest } from '@zro/utils/interface';

const EVENT = KAFKA_EVENTS.RETRY.PUSH;

/**
 * Push event to be retried.
 */
@KafkaCreateEvent(EVENT)
export class RetryPushServiceKafka {
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
      context: RetryPushServiceKafka.name,
    });
  }

  /**
   * Call Decoded pix key microservice to create.
   * @param payload Data.
   */
  async execute(payload: PushRetryRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: PushRetryKafkaRequest = {
      key: `${payload.retryQueue}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Pushing retry.', { data });

    // Emit retry event.
    await this.kafkaService.emit<void, PushRetryKafkaRequest>(EVENT, data);

    logger.debug('Retry pushed.');
  }
}
