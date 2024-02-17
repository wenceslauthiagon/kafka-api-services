import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  PixPaymentControllerEvent,
  PixPaymentEventEmitterControllerInterface,
  PixPaymentEventType,
} from '@zro/api-topazio/interface';

const eventMapper = KAFKA_EVENTS.PAYMENT;

type PixPaymentKafkaEvent = KafkaMessage<PixPaymentControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class PixPaymentEventKafkaEmitter
  implements PixPaymentEventEmitterControllerInterface
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
    this.logger = logger.child({ context: PixPaymentEventKafkaEmitter.name });
  }

  /**
   * Call payments microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitPaymentEvent(
    eventName: PixPaymentEventType,
    event: PixPaymentControllerEvent,
  ): void {
    // Request Kafka message.
    const data: PixPaymentKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit payment event.', { data });

    // Call create payment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Payment event emitted.', { result });
  }
}
