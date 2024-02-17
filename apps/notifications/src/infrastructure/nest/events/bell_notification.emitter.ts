import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/notifications/infrastructure';
import {
  BellNotificationControllerEvent,
  BellNotificationEventEmitterControllerInterface,
  BellNotificationEventType,
} from '@zro/notifications/interface';

const eventMapper = KAFKA_EVENTS.BELL_NOTIFICATION;

type BellNotificationKafkaEvent = KafkaMessage<BellNotificationControllerEvent>;

/**
 * BellNotification microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class BellNotificationEventKafkaEmitter
  implements BellNotificationEventEmitterControllerInterface
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
      context: BellNotificationEventKafkaEmitter.name,
    });
  }
  /**
   * Call bell notification microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  sentCreatedEvent(
    eventName: BellNotificationEventType,
    event: BellNotificationControllerEvent,
  ): void {
    // Request Kafka message.
    const data: BellNotificationKafkaEvent = {
      key: `${event.uuid}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit bell notification event.', { data });

    // Call create Bell notification microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Bell notification event emitted.', { result });
  }

  /**
   * Call bell notification microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitCreatedEvent(
    eventName: BellNotificationEventType,
    event: BellNotificationControllerEvent,
  ): void {
    // Request Kafka message.
    const data: BellNotificationKafkaEvent = {
      key: `${event.uuid}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit bell notification event.', { data });

    // Call create Bell notification microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Bell notification event emitted.', { result });
  }
}
