import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { KafkaService, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { PixKeyClaimEvent } from '@zro/pix-keys/application';
import { KAFKA_EVENTS } from '@zro/pix-keys/infrastructure';
import {
  PixKeyClaimEventEmitterControllerInterface,
  PixKeyClaimEventType,
} from '@zro/pix-keys/interface';

const eventMapper = KAFKA_EVENTS.PIX_KEY_CLAIM;

@Injectable()
export class PixKeyClaimEventKafkaEmitterInit {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents(Object.values(eventMapper));
  }
}

/**
 * PixKeyClaim microservice.
 */
export class PixKeyClaimEventKafkaEmitter
  implements PixKeyClaimEventEmitterControllerInterface
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
    this.logger = logger.child({ context: PixKeyClaimEventKafkaEmitter.name });
  }

  /**
   * Call pixKeyClaims microservice to emit pix message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitPixKeyClaimEvent<T extends PixKeyClaimEvent>(
    eventName: PixKeyClaimEventType,
    event: T,
  ): void {
    // Request Kafka message.
    const data: KafkaMessage<T> = {
      key: event.id,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Send pix key claim message.', { data });

    // Emit event for storage in array interceptor.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Pix key claim message sent.', { result });
  }
}
