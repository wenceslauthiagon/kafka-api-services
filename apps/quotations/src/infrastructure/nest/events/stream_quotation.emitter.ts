import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/quotations/infrastructure';
import {
  StreamQuotationControllerEvent,
  StreamQuotationEventEmitterControllerInterface,
  StreamQuotationEventType,
} from '@zro/quotations/interface';

const eventMapper = KAFKA_EVENTS.STREAM_QUOTATION;

type StreamQuotationKafkaEvent = KafkaMessage<StreamQuotationControllerEvent[]>;

/**
 * Quotations microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class StreamQuotationEventKafkaEmitter
  implements StreamQuotationEventEmitterControllerInterface
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
      context: StreamQuotationEventKafkaEmitter.name,
    });
  }

  /**
   * Call quotations microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitStreamQuotationEvent(
    eventName: StreamQuotationEventType,
    events: StreamQuotationControllerEvent[],
  ): void {
    // Request Kafka message.
    const data: StreamQuotationKafkaEvent = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: events,
    };

    this.logger.debug('Emit StreamQuotation event.', { data });

    // Emit event to Quotations microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('StreamQuotation event emitted.', { result });
  }
}
