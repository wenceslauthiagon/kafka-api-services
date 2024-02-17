import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/banking/infrastructure';
import {
  BankTedControllerEvent,
  BankTedEventEmitterControllerInterface,
  BankTedEventType,
} from '@zro/banking/interface';

const eventMapper = KAFKA_EVENTS.BANK_TED;

type BankTedKafkaEvent = KafkaMessage<BankTedControllerEvent>;

/**
 * Banking microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class BankTedEventKafkaEmitter
  implements BankTedEventEmitterControllerInterface
{
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param eventEmitter Event emitter.
   * @param logger Global logger.
   */
  constructor(
    private requestId: string,
    private eventEmitter: KafkaEventEmitter,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: BankTedEventKafkaEmitter.name });
  }

  /**
   * Call banks microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitBankTedEvent(
    eventName: BankTedEventType,
    event: BankTedControllerEvent,
  ): void {
    // Request Kafka message.
    const data: BankTedKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit BankTed event.', { data });

    // Emit event to Banking microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('BankTed event emitted.', { result });
  }
}
