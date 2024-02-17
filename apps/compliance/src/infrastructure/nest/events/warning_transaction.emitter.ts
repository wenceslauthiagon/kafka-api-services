import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/compliance/infrastructure';
import {
  WarningTransactionControllerEvent,
  WarningTransactionEventEmitterControllerInterface,
  WarningTransactionEventType,
} from '@zro/compliance/interface';

const eventMapper = KAFKA_EVENTS.WARNING_TRANSACTION;

type WarningTransactionKafkaEvent =
  KafkaMessage<WarningTransactionControllerEvent>;

/**
 * WarningTransaction microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class WarningTransactionEventKafkaEmitter
  implements WarningTransactionEventEmitterControllerInterface
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
      context: WarningTransactionEventKafkaEmitter.name,
    });
  }
  emitWarningTransactionEvent(
    eventName: WarningTransactionEventType,
    event: WarningTransactionControllerEvent,
  ): void {
    // Request Kafka message.
    const data: WarningTransactionKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit warning transaction event.', { data });

    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Warning transaction event emitted.', { result });
  }
}
