import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/api-topazio/infrastructure';
import {
  NotifyDebitControllerEvent,
  NotifyDebitEventEmitterControllerInterface,
  NotifyDebitEventType,
} from '@zro/api-topazio/interface';

const eventMapper = KAFKA_EVENTS.NOTIFY_DEBIT;

type NotifyDebitKafkaEvent = KafkaMessage<NotifyDebitControllerEvent>;

/**
 * ApiTopazio microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class NotifyDebitEventKafkaEmitter
  implements NotifyDebitEventEmitterControllerInterface
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
    this.logger = logger.child({ context: NotifyDebitEventKafkaEmitter.name });
  }

  /**
   * Call ApiTopazio microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitDebitEvent(
    eventName: NotifyDebitEventType,
    event: NotifyDebitControllerEvent,
  ): void {
    // Request Kafka message.
    const data: NotifyDebitKafkaEvent = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit notify event.', { data });

    // Call create ApiTopazio microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Notify event emitted.', { result });
  }
}
