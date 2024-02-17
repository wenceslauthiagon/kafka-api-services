import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  DecodedPixAccountControllerEvent,
  DecodedPixAccountEventEmitterControllerInterface,
  DecodedPixAccountEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.DECODED_PIX_ACCOUNT;

type DecodedPixAccountKafkaEvent =
  KafkaMessage<DecodedPixAccountControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class DecodedPixAccountEventKafkaEmitter
  implements DecodedPixAccountEventEmitterControllerInterface
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
      context: DecodedPixAccountEventKafkaEmitter.name,
    });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitDecodedPixAccountEvent(
    eventName: DecodedPixAccountEventType,
    event: DecodedPixAccountControllerEvent,
  ): void {
    // Request Kafka message.
    const data: DecodedPixAccountKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit DecodedPixAccount event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('DecodedPixAccount event emitted.', { result });
  }
}
