import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  DecodedQrCodeControllerEvent,
  DecodeQrCodeEventEmitterControllerInterface,
  DecodedQrCodeEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.DECODED_QR_CODE;

type DecodedQrCodeKafkaEvent = KafkaMessage<DecodedQrCodeControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class DecodeQrCodeEventKafkaEmitter
  implements DecodeQrCodeEventEmitterControllerInterface
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
    this.logger = logger.child({ context: DecodeQrCodeEventKafkaEmitter.name });
  }

  /**
   * Call to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitDecodedQrCodeEvent(
    eventName: DecodedQrCodeEventType,
    event: DecodedQrCodeControllerEvent,
  ): void {
    // Request Kafka message.
    const data: DecodedQrCodeKafkaEvent = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit DecodedQrCode event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('DecodedQrCode event emitted.', { result });
  }
}
