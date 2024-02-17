import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/compliance/infrastructure';
import {
  UserLimitRequestControllerEvent,
  UserLimitRequestEventEmitterControllerInterface,
  UserLimitRequestEventType,
} from '@zro/compliance/interface';

const eventMapper = KAFKA_EVENTS.USER_LIMIT_REQUEST;

type UserLimitRequestKafkaEvent = KafkaMessage<UserLimitRequestControllerEvent>;

/**
 * User microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class UserLimitRequestEventKafkaEmitter
  implements UserLimitRequestEventEmitterControllerInterface
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
      context: UserLimitRequestEventKafkaEmitter.name,
    });
  }

  /**
   * Call  to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitUserLimitRequestEvent(
    eventName: UserLimitRequestEventType,
    event: UserLimitRequestControllerEvent,
  ): void {
    // Request Kafka message.
    const data: UserLimitRequestKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit User limit request event.', { data });

    // Call create User limit request microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('User limit request event emitted.', { result });
  }
}
