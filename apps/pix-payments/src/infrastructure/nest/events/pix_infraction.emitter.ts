import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  PixInfractionControllerEvent,
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.PIX_INFRACTION;

type PixInfractionKafkaEvent = KafkaMessage<PixInfractionControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class PixInfractionEventKafkaEmitter
  implements PixInfractionEventEmitterControllerInterface
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
      context: PixInfractionEventKafkaEmitter.name,
    });
  }

  /**
   * Call to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitInfractionEvent(
    eventName: PixInfractionEventType,
    event: PixInfractionControllerEvent,
  ): void {
    // Request Kafka message.
    const data: PixInfractionKafkaEvent = {
      key: event.id,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit Infraction event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Infraction event emitted.', { result });
  }
}
