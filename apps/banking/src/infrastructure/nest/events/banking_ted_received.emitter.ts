import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/banking/infrastructure';
import {
  BankingTedReceivedControllerEvent,
  BankingTedReceivedEventEmitterControllerInterface,
  BankingTedReceivedEventType,
} from '@zro/banking/interface';

const eventMapper = KAFKA_EVENTS.BANKING_TED_RECEIVED;

type BankingTedReceivedKafkaEvent =
  KafkaMessage<BankingTedReceivedControllerEvent>;

/**
 * BankingTedReceived microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class BankingTedReceivedEventKafkaEmitter
  implements BankingTedReceivedEventEmitterControllerInterface
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
    this.logger = logger.child({
      context: BankingTedReceivedEventKafkaEmitter.name,
    });
  }

  /**
   * Call banks microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitBankingTedReceivedEvent(
    eventName: BankingTedReceivedEventType,
    event: BankingTedReceivedControllerEvent,
  ): void {
    // Request Kafka message.
    const data: BankingTedReceivedKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit BankingTedReceived event.', { data });

    // Emit event to BankingTedReceived microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('BankingTedReceived event emitted.', { result });
  }
}
