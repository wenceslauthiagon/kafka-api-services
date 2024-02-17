import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/banking/infrastructure';
import {
  BankingTedControllerEvent,
  BankingTedEventEmitterControllerInterface,
  BankingTedEventType,
} from '@zro/banking/interface';

const eventMapper = KAFKA_EVENTS.BANKING_TED;

type BankingTedKafkaEvent = KafkaMessage<BankingTedControllerEvent>;

/**
 * BankingTed microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class BankingTedEventKafkaEmitter
  implements BankingTedEventEmitterControllerInterface
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
    this.logger = logger.child({ context: BankingTedEventKafkaEmitter.name });
  }

  /**
   * Call banks microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitBankingTedEvent(
    eventName: BankingTedEventType,
    event: BankingTedControllerEvent,
  ): void {
    // Request Kafka message.
    const data: BankingTedKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit BankingTed event.', { data });

    // Emit event to BankingTed microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('BankingTed event emitted.', { result });
  }
}
