import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/users/infrastructure';
import {
  UserForgotPasswordControllerEvent,
  UserForgotPasswordEventEmitterControllerInterface,
  UserForgotPasswordEventType,
} from '@zro/users/interface';

const eventMapper = KAFKA_EVENTS.USER_FORGOT_PASSWORD;

type UserForgotPasswordKafkaEvent =
  KafkaMessage<UserForgotPasswordControllerEvent>;

/**
 * UserForgotPassword microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class UserForgotPasswordEventKafkaEmitter
  implements UserForgotPasswordEventEmitterControllerInterface
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
      context: UserForgotPasswordEventKafkaEmitter.name,
    });
  }

  /**
   * Call  to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitUserForgotPasswordEvent(
    eventName: UserForgotPasswordEventType,
    event: UserForgotPasswordControllerEvent,
  ): void {
    // Request Kafka message.
    const data: UserForgotPasswordKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit UserForgotPassword event.', { data });

    // Call create UserForgotPassword microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('UserForgotPassword event emitted.', { result });
  }
}
