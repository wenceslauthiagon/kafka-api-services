import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  RemittanceControllerEvent,
  RemittanceEventEmitterControllerInterface,
  RemittanceEventType,
} from '@zro/otc/interface';

const eventMapper = KAFKA_EVENTS.REMITTANCE;

type RemittanceKafkaEvent = KafkaMessage<RemittanceControllerEvent>;

/**
 * Remittance microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class RemittanceEventKafkaEmitter
  implements RemittanceEventEmitterControllerInterface
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
      context: RemittanceEventKafkaEmitter.name,
    });
  }

  /**
   * Call Remittance microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitRemittanceEvent(
    eventName: RemittanceEventType,
    event: RemittanceControllerEvent,
  ): void {
    // Request Kafka message.
    const data: RemittanceKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit remittance event.', { data });

    // Emit event to remittance microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Remittance event emitted.', { result });
  }
}
