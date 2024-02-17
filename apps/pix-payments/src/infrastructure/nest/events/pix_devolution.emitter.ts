import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  PixDevolutionControllerEvent,
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.PIX_DEVOLUTION;

type PixDevolutionKafkaEvent = KafkaMessage<PixDevolutionControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class PixDevolutionEventKafkaEmitter
  implements PixDevolutionEventEmitterControllerInterface
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
      context: PixDevolutionEventKafkaEmitter.name,
    });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitDevolutionEvent(
    eventName: PixDevolutionEventType,
    event: PixDevolutionControllerEvent,
  ): void {
    // Request Kafka message.
    const data: PixDevolutionKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit devolution event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Devolution event emitted.', { result });
  }
}
