import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  ConversionControllerEvent,
  ConversionEventEmitterControllerInterface,
  ConversionEventType,
} from '@zro/otc/interface';

const eventMapper = KAFKA_EVENTS.CONVERSION;

type ConversionKafkaEvent = KafkaMessage<ConversionControllerEvent>;

/**
 * Conversion microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class ConversionEventKafkaEmitter
  implements ConversionEventEmitterControllerInterface
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
    this.logger = logger.child({ context: ConversionEventKafkaEmitter.name });
  }

  /**
   * Call Conversion microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitConversionEvent(
    eventName: ConversionEventType,
    event: ConversionControllerEvent,
  ): void {
    // Request Kafka message.
    const data: ConversionKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit Conversion event.', { data });

    // Emit event to Conversion microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Conversion event emitted.', { result });
  }
}
