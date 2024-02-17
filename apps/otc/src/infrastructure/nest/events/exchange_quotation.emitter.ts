import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  ExchangeQuotationControllerEvent,
  ExchangeQuotationEventEmitterControllerInterface,
  ExchangeQuotationEventType,
} from '@zro/otc/interface';

const eventMapper = KAFKA_EVENTS.EXCHANGE_QUOTATION;

type ExchangeQuotationKafkaEvent =
  KafkaMessage<ExchangeQuotationControllerEvent>;

/**
 * exchange quotation microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class ExchangeQuotationEventKafkaEmitter
  implements ExchangeQuotationEventEmitterControllerInterface
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
      context: ExchangeQuotationEventKafkaEmitter.name,
    });
  }

  /**
   * Call exchange quotation microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitExchangeQuotationEvent(
    eventName: ExchangeQuotationEventType,
    event: ExchangeQuotationControllerEvent,
  ): void {
    // Request Kafka message.
    const data: ExchangeQuotationKafkaEvent = {
      key: `${event.solicitationPspId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit exchange quotation event.', { data });

    // Emit event to exchange quotation microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('ExchangeQuotation event emitted.', { result });
  }
}
