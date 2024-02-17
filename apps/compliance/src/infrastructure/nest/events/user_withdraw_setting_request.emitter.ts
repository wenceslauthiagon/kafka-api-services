import { Logger } from 'winston';

import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/compliance/infrastructure';
import {
  UserWithdrawSettingRequestControllerEvent,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
  UserWithdrawSettingRequestEventType,
} from '@zro/compliance/interface';

const eventMapper = KAFKA_EVENTS.USER_WITHDRAW_SETTING_REQUEST;

type UserWithdrawSettingRequestKafkaEvent =
  KafkaMessage<UserWithdrawSettingRequestControllerEvent>;

/**
 * Compliance microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class UserWithdrawSettingRequestEventKafkaEmitter
  implements UserWithdrawSettingRequestEventEmitterControllerInterface
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
      context: UserWithdrawSettingRequestEventKafkaEmitter.name,
    });
  }

  /**
   * Call  to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitUserWithdrawSettingRequestEvent(
    eventName: UserWithdrawSettingRequestEventType,
    event: UserWithdrawSettingRequestControllerEvent,
  ): void {
    // Request Kafka message.
    const data: UserWithdrawSettingRequestKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit User withdraw setting request event.', { data });

    // Call create User limit request microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('User withdraw setting request event emitted.', {
      result,
    });
  }
}
