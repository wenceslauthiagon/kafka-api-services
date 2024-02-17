import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/banking/infrastructure';
import {
  BankControllerEvent,
  BankEventEmitterControllerInterface,
  BankEventType,
} from '@zro/banking/interface';

const eventMapper = KAFKA_EVENTS.BANK;

type BankKafkaEvent = KafkaMessage<BankControllerEvent>;

/**
 * Banking microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class BankEventKafkaEmitter
  implements BankEventEmitterControllerInterface
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
    this.logger = logger.child({ context: BankEventKafkaEmitter.name });
  }

  /**
   * Call banks microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitBankEvent(eventName: BankEventType, event: BankControllerEvent): void {
    // Request Kafka message.
    const data: BankKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit Bank event.', { data });

    // Emit event to Banking microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Bank event emitted.', { result });
  }
}
