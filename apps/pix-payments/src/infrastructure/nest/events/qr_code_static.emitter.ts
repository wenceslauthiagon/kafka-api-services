import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  QrCodeStaticControllerEvent,
  QrCodeStaticEventEmitterControllerInterface,
  QrCodeStaticEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.QR_CODE_STATIC;

type QrCodeStaticKafkaEvent = KafkaMessage<QrCodeStaticControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class QrCodeStaticEventKafkaEmitter
  implements QrCodeStaticEventEmitterControllerInterface
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
    this.logger = logger.child({ context: QrCodeStaticEventKafkaEmitter.name });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitQrCodeStaticEvent(
    eventName: QrCodeStaticEventType,
    event: QrCodeStaticControllerEvent,
  ): void {
    // Request Kafka message.
    const data: QrCodeStaticKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit qrCodeStatic event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('QrCodeStatic event emitted.', { result });
  }
}
