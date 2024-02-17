import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  PixRefundDevolutionControllerEvent,
  PixRefundDevolutionEventEmitterControllerInterface,
  PixRefundDevolutionEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.PIX_REFUND_DEVOLUTION;

type PixRefundDevolutionKafkaEvent =
  KafkaMessage<PixRefundDevolutionControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class PixRefundDevolutionEventKafkaEmitter
  implements PixRefundDevolutionEventEmitterControllerInterface
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
      context: PixRefundDevolutionEventKafkaEmitter.name,
    });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitDevolutionEvent(
    eventName: PixRefundDevolutionEventType,
    event: PixRefundDevolutionControllerEvent,
  ): void {
    // Request Kafka message.
    const data: PixRefundDevolutionKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit refund devolution event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Refund Devolution event emitted.', { result });
  }
}
