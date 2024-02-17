import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  RemittanceOrderControllerEvent,
  RemittanceOrderEventEmitterControllerInterface,
  RemittanceOrderEventType,
} from '@zro/otc/interface';

const eventMapper = KAFKA_EVENTS.REMITTANCE_ORDER;

type RemittanceOrderKafkaEvent = KafkaMessage<RemittanceOrderControllerEvent>;

/**
 * Remittance Order microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class RemittanceOrderEventKafkaEmitter
  implements RemittanceOrderEventEmitterControllerInterface
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
    this.logger = logger.child({
      context: RemittanceOrderEventKafkaEmitter.name,
    });
  }

  /**
   * Call Remittance Order microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitRemittanceOrderEvent(
    eventName: RemittanceOrderEventType,
    event: RemittanceOrderControllerEvent,
  ): void {
    // Request Kafka message.
    const data: RemittanceOrderKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit remittance order event.', { data });

    // Emit event to remittance order microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Remittance order event emitted.', { result });
  }
}
