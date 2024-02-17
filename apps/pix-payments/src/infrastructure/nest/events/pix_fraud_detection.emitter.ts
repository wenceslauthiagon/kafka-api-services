import { Logger } from 'winston';
import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  PixFraudDetectionControllerEvent,
  PixFraudDetectionEventEmitterControllerInterface,
  PixFraudDetectionEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.PIX_FRAUD_DETECTION;

type PixFraudDetectionKafkaEvent =
  KafkaMessage<PixFraudDetectionControllerEvent>;

/**
 * PixPayment microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class PixFraudDetectionEventKafkaEmitter
  implements PixFraudDetectionEventEmitterControllerInterface
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
      context: PixFraudDetectionEventKafkaEmitter.name,
    });
  }

  /**
   * Call to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitPixFraudDetectionEvent(
    eventName: PixFraudDetectionEventType,
    event: PixFraudDetectionControllerEvent,
  ): void {
    // Request Kafka message.
    const data: PixFraudDetectionKafkaEvent = {
      key: event.id,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit pix fraud detection event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Pix fraud detection event emitted.', { result });
  }
}
