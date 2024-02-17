import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  PaymentControllerEvent,
  PaymentEventEmitterControllerInterface,
  PaymentEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.PAYMENT;

type PaymentKafkaEvent = KafkaMessage<PaymentControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class PaymentEventKafkaEmitter
  implements PaymentEventEmitterControllerInterface
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
    this.logger = logger.child({ context: PaymentEventKafkaEmitter.name });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitPaymentEvent(
    eventName: PaymentEventType,
    event: PaymentControllerEvent,
  ): void {
    // Request Kafka message.
    const data: PaymentKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit PixPayment event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('PixPayment event emitted.', { result });
  }
}
