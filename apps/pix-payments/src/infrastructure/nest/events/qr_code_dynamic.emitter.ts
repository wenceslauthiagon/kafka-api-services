import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  QrCodeDynamicControllerEvent,
  QrCodeDynamicEventEmitterControllerInterface,
  QrCodeDynamicEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.QR_CODE_DYNAMIC;

type QrCodeDynamicKafkaEvent = KafkaMessage<QrCodeDynamicControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class QrCodeDynamicEventKafkaEmitter
  implements QrCodeDynamicEventEmitterControllerInterface
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
      context: QrCodeDynamicEventKafkaEmitter.name,
    });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitQrCodeDynamicEvent(
    eventName: QrCodeDynamicEventType,
    event: QrCodeDynamicControllerEvent,
  ): void {
    // Request Kafka message.
    const data: QrCodeDynamicKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit qrCodeDynamic event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('QrCodeDynamic event emitted.', { result });
  }
}
