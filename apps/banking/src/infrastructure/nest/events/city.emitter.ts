import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/banking/infrastructure';
import {
  CityControllerEvent,
  CityEventEmitterControllerInterface,
  CityEventType,
} from '@zro/banking/interface';

const eventMapper = KAFKA_EVENTS.CITY;

type CityKafkaEvent = KafkaMessage<CityControllerEvent>;

/**
 * City microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class CityEventKafkaEmitter
  implements CityEventEmitterControllerInterface
{
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param eventEmitter Event emitter.
   * @param logger Global logger.
   */
  constructor(
    private requestId: string,
    private eventEmitter: KafkaEventEmitter,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: CityEventKafkaEmitter.name });
  }

  /**
   * Call cities microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitCityEvent(eventName: CityEventType, event: CityControllerEvent): void {
    // Request Kafka message.
    const data: CityKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit City event.', { data });

    // Emit event for storage in array interceptor.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('City event emitted.', { result });
  }
}
