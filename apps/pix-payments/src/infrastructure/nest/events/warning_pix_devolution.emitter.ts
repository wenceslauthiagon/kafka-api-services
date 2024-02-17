import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  WarningPixDevolutionControllerEvent,
  WarningPixDevolutionEventEmitterControllerInterface,
  WarningPixDevolutionEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.WARNING_PIX_DEVOLUTION;

type WarningPixDevolutionKafkaEvent =
  KafkaMessage<WarningPixDevolutionControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class WarningPixDevolutionEventKafkaEmitter
  implements WarningPixDevolutionEventEmitterControllerInterface
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
      context: WarningPixDevolutionEventKafkaEmitter.name,
    });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitDevolutionEvent(
    eventName: WarningPixDevolutionEventType,
    event: WarningPixDevolutionControllerEvent,
  ): void {
    // Request Kafka message.
    const data: WarningPixDevolutionKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit warning pix devolution event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Warning pix devolution event emitted.', {
      result,
    });
  }
}
