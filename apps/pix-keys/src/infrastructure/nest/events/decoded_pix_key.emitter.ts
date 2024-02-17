import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { KafkaService, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { DecodedPixKeyEvent } from '@zro/pix-keys/application';
import { KAFKA_EVENTS } from '@zro/pix-keys/infrastructure';
import {
  DecodedPixKeyEventEmitterControllerInterface,
  DecodedPixKeyEventType,
} from '@zro/pix-keys/interface';

const eventMapper = KAFKA_EVENTS.DECODED_KEY;

@Injectable()
export class DecodedPixKeyEventKafkaEmitterInit {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents(Object.values(eventMapper));
  }
}

/**
 * DecodedPixKey microservice.
 */
export class DecodedPixKeyEventKafkaEmitter
  implements DecodedPixKeyEventEmitterControllerInterface
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
      context: DecodedPixKeyEventKafkaEmitter.name,
    });
  }

  /**
   * Call decodedPixKeys microservice to emit decoded pix message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitDecodedPixKeyEvent<T extends DecodedPixKeyEvent>(
    eventName: DecodedPixKeyEventType,
    event: T,
  ): void {
    // Request Kafka message.
    const data: KafkaMessage<T> = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Send decoded pix message.', { data });

    // Emit event for storage in array interceptor.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Decoded pix message sent.', { result });
  }
}
