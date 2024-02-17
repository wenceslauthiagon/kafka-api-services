import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-zro-pay/infrastructure';
import {
  QrCodeControllerEvent,
  QrCodeEventEmitterControllerInterface,
  QrCodeEventType,
} from '@zro/pix-zro-pay/interface';

const eventMapper = KAFKA_EVENTS.QR_CODE;

type QrCodeKafkaEvent = KafkaMessage<QrCodeControllerEvent>;

/**
 * PixZroPay microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class QrCodeEventKafkaEmitter
  implements QrCodeEventEmitterControllerInterface
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
    this.logger = logger.child({ context: QrCodeEventKafkaEmitter.name });
  }

  /**
   * Call PixZroPay microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitQrCodeEvent(
    eventName: QrCodeEventType,
    event: QrCodeControllerEvent,
  ): void {
    // Request Kafka message.
    const data: QrCodeKafkaEvent = {
      key: `${event.transactionUuid}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit qrCode event.', { data });

    // Emit event to PixZroPay microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('QrCode event emitted.', { result });
  }
}
