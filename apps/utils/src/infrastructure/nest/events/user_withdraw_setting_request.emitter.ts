import { Logger } from 'winston';

import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/utils/infrastructure';
import {
  UserWithdrawSettingControllerEvent,
  UserWithdrawSettingEventEmitterControllerInterface,
  UserWithdrawSettingEventType,
} from '@zro/utils/interface';

const eventMapper = KAFKA_EVENTS.USER_WITHDRAW_SETTING;

type UserWithdrawSettingKafkaEvent =
  KafkaMessage<UserWithdrawSettingControllerEvent>;

/**
 * Compliance microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class UserWithdrawSettingEventKafkaEmitter
  implements UserWithdrawSettingEventEmitterControllerInterface
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
      context: UserWithdrawSettingEventKafkaEmitter.name,
    });
  }

  /**
   * Call  to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitUserWithdrawSettingEvent(
    eventName: UserWithdrawSettingEventType,
    event: UserWithdrawSettingControllerEvent,
  ): void {
    //  Kafka message.
    const data: UserWithdrawSettingKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit User withdraw setting event.', { data });

    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('User withdraw setting event emitted.', {
      result,
    });
  }
}
