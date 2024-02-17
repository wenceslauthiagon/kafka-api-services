import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/users/infrastructure';
import {
  UserControllerEvent,
  UserEventEmitterControllerInterface,
  UserEventType,
} from '@zro/users/interface';

const eventMapper = KAFKA_EVENTS.USER;

type UserKafkaEvent = KafkaMessage<UserControllerEvent>;

/**
 * User microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class UserEventKafkaEmitter
  implements UserEventEmitterControllerInterface
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
    this.logger = logger.child({ context: UserEventKafkaEmitter.name });
  }

  /**
   * Call  to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitUserEvent(eventName: UserEventType, event: UserControllerEvent): void {
    // Request Kafka message.
    const data: UserKafkaEvent = {
      key: `${event.uuid}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit User event.', { data });

    // Call create PixDecodedAccount microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('User event emitted.', { result });
  }
}
