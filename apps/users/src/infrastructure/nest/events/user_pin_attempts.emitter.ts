import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import {
  UserPinAttemptsEventEmitterControllerInterface,
  UserPinAttemptsEventType,
} from '@zro/users/interface';
import { UserPinAttemptsEvent } from '@zro/users/application';
import { KAFKA_EVENTS } from '@zro/users/infrastructure';
/**
 * UserPinAttempts kafka event emitter.
 */
@KafkaCreateEvent(Object.values(KAFKA_EVENTS.USER_PIN_ATTEMPTS))
export class UserPinAttemptsEventKafkaEmitter
  implements UserPinAttemptsEventEmitterControllerInterface
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
      context: UserPinAttemptsEventKafkaEmitter.name,
    });
  }

  /**
   * Emit user pin attempts event to Kafka.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitUserPinAttemptsEvent<T extends UserPinAttemptsEvent>(
    eventName: UserPinAttemptsEventType,
    event: T,
  ): void {
    // Request Kafka message.
    const data: KafkaMessage<T> = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit user pin attempts event to Kafka.', { data });

    // Emit event for storage in array interceptor.
    const result = this.eventEmitter.emit({
      name: KAFKA_EVENTS.USER_PIN_ATTEMPTS[eventName],
      data,
    });

    this.logger.debug('User pin attempts event emitted.', { result });
  }
}
