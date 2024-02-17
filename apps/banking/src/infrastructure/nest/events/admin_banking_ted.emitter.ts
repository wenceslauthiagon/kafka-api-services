import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/banking/infrastructure';
import {
  AdminBankingTedControllerEvent,
  AdminBankingTedEventEmitterControllerInterface,
  AdminBankingTedEventType,
} from '@zro/banking/interface';

const eventMapper = KAFKA_EVENTS.ADMIN_BANKING_TED;

type AdminBankingTedKafkaEvent = KafkaMessage<AdminBankingTedControllerEvent>;

/**
 * AdminBankingTed microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class AdminBankingTedEventKafkaEmitter
  implements AdminBankingTedEventEmitterControllerInterface
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
      context: AdminBankingTedEventKafkaEmitter.name,
    });
  }

  /**
   * Call banks microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitAdminBankingTedEvent(
    eventName: AdminBankingTedEventType,
    event: AdminBankingTedControllerEvent,
  ): void {
    // Request Kafka message.
    const data: AdminBankingTedKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit AdminBankingTed event.', { data });

    // Emit event to AdminBankingTed microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('AdminBankingTed event emitted.', { result });
  }
}
