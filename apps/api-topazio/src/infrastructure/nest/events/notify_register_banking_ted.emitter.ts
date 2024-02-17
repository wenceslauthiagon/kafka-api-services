import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/api-topazio/infrastructure';
import {
  NotifyRegisterBankingTedControllerEvent,
  NotifyRegisterBankingTedEventEmitterControllerInterface,
  NotifyRegisterBankingTedEventType,
} from '@zro/api-topazio/interface';

const eventMapper = KAFKA_EVENTS.NOTIFY_REGISTER_BANKING_TED;

type NotifyRegisterBankingTedKafkaEvent =
  KafkaMessage<NotifyRegisterBankingTedControllerEvent>;

/**
 * ApiTopazio microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class NotifyRegisterBankingTedEventKafkaEmitter
  implements NotifyRegisterBankingTedEventEmitterControllerInterface
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
      context: NotifyRegisterBankingTedEventKafkaEmitter.name,
    });
  }

  /**
   * Call ApiTopazio microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitRegisterEvent(
    eventName: NotifyRegisterBankingTedEventType,
    event: NotifyRegisterBankingTedControllerEvent,
  ): void {
    // Request Kafka message.
    const data: NotifyRegisterBankingTedKafkaEvent = {
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
