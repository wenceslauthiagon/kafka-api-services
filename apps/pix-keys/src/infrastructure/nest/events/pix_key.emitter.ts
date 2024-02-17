import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { KafkaService, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { PixKeyEvent } from '@zro/pix-keys/application';
import { KAFKA_EVENTS } from '@zro/pix-keys/infrastructure';
import {
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';

const eventMapper = KAFKA_EVENTS.KEY;

@Injectable()
export class PixKeyEventKafkaEmitterInit {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents(Object.values(eventMapper));
  }
}

/**
 * PixKey microservice.
 */
export class PixKeyEventKafkaEmitter
  implements PixKeyEventEmitterControllerInterface
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
    this.logger = logger.child({ context: PixKeyEventKafkaEmitter.name });
  }

  /**
   * Call pixKeys microservice to emit pix message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitPixKeyEvent<T extends PixKeyEvent>(
    eventName: PixKeyEventType,
    event: T,
  ): void {
    // Request Kafka message.
    const data: KafkaMessage<T> = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Send pix message.', { data });

    // Emit event for storage in array interceptor.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    const historyEvent: PixKeyEvent = {
      id: event.id,
      state: event.state,
      userId: event.userId,
    };

    // Emit event for state history.
    this.emitPixKeyEventHistory(historyEvent);

    this.logger.debug('Pix message sent.', { result });
  }

  emitPixKeyEventHistory(event: PixKeyEvent): void {
    // Request Kafka message.
    const data: KafkaMessage<PixKeyEvent> = {
      key: `${event.userId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Send pix history message for change state.', { data });

    // Call create PixKey microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[PixKeyEventType.STATE_HISTORY],
      data,
    });

    this.logger.debug('Pix message history sent.', { result });
  }
}
