import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  CryptoOrderControllerEvent,
  CryptoOrderEventEmitterControllerInterface,
  CryptoOrderEventType,
} from '@zro/otc/interface';

const eventMapper = KAFKA_EVENTS.CRYPTO_ORDER;

type CryptoOrderKafkaEvent = KafkaMessage<CryptoOrderControllerEvent>;

/**
 * CryptoOrder microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class CryptoOrderEventKafkaEmitter
  implements CryptoOrderEventEmitterControllerInterface
{
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param eventEmitter Client to access Kafka.
   * @param logger Global logger.
   */
  constructor(
    private requestId: string,
    private eventEmitter: KafkaEventEmitter,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: CryptoOrderEventKafkaEmitter.name });
  }

  /**
   * Call CryptoOrder microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitCryptoOrderEvent(
    eventName: CryptoOrderEventType,
    event: CryptoOrderControllerEvent,
  ): void {
    // Request Kafka message.
    const data: CryptoOrderKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit CryptoOrder event.', { data });

    // Emit event to CryptoOrder microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('CryptoOrder event emitted.', { result });
  }
}
