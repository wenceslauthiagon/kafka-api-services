import { Logger } from 'winston';

import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/signup/infrastructure';
import {
  SignupControllerEvent,
  SignupEventEmitterControllerInterface,
  SignupEventType,
} from '@zro/signup/interface';

const eventMapper = KAFKA_EVENTS.SIGNUP;

type SignupKafkaEvent = KafkaMessage<SignupControllerEvent>;

/**
 * Signup microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class SignupEventKafkaEmitter
  implements SignupEventEmitterControllerInterface
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
      context: SignupEventKafkaEmitter.name,
    });
  }

  /**
   * Call  to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitSignupEvent(
    eventName: SignupEventType,
    event: SignupControllerEvent,
  ): void {
    // Request Kafka message.
    const data: SignupKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit Signup event.', { data });

    // Call create PixDecodedAccount microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Signup event emitted.', { result });
  }
}
