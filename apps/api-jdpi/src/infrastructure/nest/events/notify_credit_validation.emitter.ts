import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/api-jdpi/infrastructure';
import {
  NotifyCreditValidationControllerEvent,
  NotifyCreditValidationEventEmitterControllerInterface,
  NotifyCreditValidationEventType,
} from '@zro/api-jdpi/interface';

const eventMapper = KAFKA_EVENTS.NOTIFY_CREDIT_VALIDATION;

type NotifyCreditValidationKafkaEvent =
  KafkaMessage<NotifyCreditValidationControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class NotifyCreditValidationEventKafkaEmitter
  implements NotifyCreditValidationEventEmitterControllerInterface
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
      context: NotifyCreditValidationEventKafkaEmitter.name,
    });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitValidationEvent(
    eventName: NotifyCreditValidationEventType,
    event: NotifyCreditValidationControllerEvent,
  ): void {
    // Request Kafka message.
    const data: NotifyCreditValidationKafkaEvent = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit validation event.', { data });

    // Call create PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Validation event emitted.', { result });
  }
}
