import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import {
  UserLimitControllerEvent,
  UserLimitEventEmitterControllerInterface,
  UserLimitEventType,
} from '@zro/operations/interface';
import { KAFKA_EVENTS } from '@zro/operations/infrastructure';

const eventMapper = KAFKA_EVENTS.USER_LIMIT;

type UserLimitKafkaEvent = KafkaMessage<UserLimitControllerEvent>;

/**
 * Operation microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class UserLimitEventKafkaEmitter
  implements UserLimitEventEmitterControllerInterface
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
    this.logger = logger.child({ context: UserLimitEventKafkaEmitter.name });
  }

  /**
   * Call Operation microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitUserLimitEvent(
    eventName: UserLimitEventType,
    event: UserLimitControllerEvent,
  ): void {
    // Request Kafka message.
    const data: UserLimitKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Send User limit message.', { data });

    // Emit event to Operation microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('User limit message sent.', { result });
  }
}
