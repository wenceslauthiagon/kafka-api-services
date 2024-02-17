import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  PixDevolutionReceivedControllerEvent,
  PixDevolutionReceivedEventEmitterControllerInterface,
  PixDevolutionReceivedEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.PIX_DEVOLUTION_RECEIVED;

type PixDevolutionReceivedKafkaEvent =
  KafkaMessage<PixDevolutionReceivedControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class PixDevolutionReceivedEventKafkaEmitter
  implements PixDevolutionReceivedEventEmitterControllerInterface
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
      context: PixDevolutionReceivedEventKafkaEmitter.name,
    });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitDevolutionReceivedEvent(
    eventName: PixDevolutionReceivedEventType,
    event: PixDevolutionReceivedControllerEvent,
  ): void {
    // Request Kafka message.
    const data: PixDevolutionReceivedKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit PixDevolutionReceived event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('PixDevolutionReceived event emitted.', { result });
  }
}
