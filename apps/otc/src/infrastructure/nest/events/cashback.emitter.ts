import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  CashbackControllerEvent,
  CashbackEventEmitterControllerInterface,
  CashbackEventType,
} from '@zro/otc/interface';

const eventMapper = KAFKA_EVENTS.CASHBACK;

type CashbackKafkaEvent = KafkaMessage<CashbackControllerEvent>;

/**
 * Cashback microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class CashbackEventKafkaEmitter
  implements CashbackEventEmitterControllerInterface
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
    this.logger = logger.child({ context: CashbackEventKafkaEmitter.name });
  }

  /**
   * Call Cashback microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitCashbackEvent(
    eventName: CashbackEventType,
    event: CashbackControllerEvent,
  ): void {
    // Request Kafka message.
    const data: CashbackKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit Cashback event.', { data });

    // Emit event to Cashback microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Cashback event emitted.', { result });
  }
}
