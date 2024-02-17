import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  PixRefundControllerEvent,
  PixRefundEventEmitterControllerInterface,
  PixRefundEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.PIX_REFUND;

type PixRefundKafkaEvent = KafkaMessage<PixRefundControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class PixRefundEventKafkaEmitter
  implements PixRefundEventEmitterControllerInterface
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
      context: PixRefundEventKafkaEmitter.name,
    });
  }

  /**
   * Call to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitPixRefundEvent(
    eventName: PixRefundEventType,
    event: PixRefundControllerEvent,
  ): void {
    // Request Kafka message.
    const data: PixRefundKafkaEvent = {
      key: event.id,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit PixRefund event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('PixRefund event emitted.', { result });
  }
}
