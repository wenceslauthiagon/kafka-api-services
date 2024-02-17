import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import {
  KafkaService,
  KafkaEventEmitter,
  KafkaMessage,
  NullPointerException,
} from '@zro/common';
import { SpreadEvent } from '@zro/otc/application';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  SpreadEventEmitterControllerInterface,
  SpreadEventType,
} from '@zro/otc/interface';

const eventMapper = {
  [SpreadEventType.CREATED]: KAFKA_EVENTS.SPREAD.CREATED,
  [SpreadEventType.DELETED]: KAFKA_EVENTS.SPREAD.DELETED,
};

@Injectable()
export class SpreadEventKafkaEmitterInit {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents(Object.values(eventMapper));
  }
}

/**
 * Spread microservice.
 */
export class SpreadEventKafkaEmitter
  implements SpreadEventEmitterControllerInterface
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
    this.logger = logger.child({ context: SpreadEventKafkaEmitter.name });
  }

  /**
   * Call quotations microservice to emit spread message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitSpreadEvent(eventName: SpreadEventType, event: SpreadEvent[]): void {
    if (!event.length) {
      throw new NullPointerException('Event length must be greater than zero.');
    }

    const key = event[0];

    // Request Kafka message.
    const data: KafkaMessage<SpreadEvent[]> = {
      key: `${key.currencySymbol}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Send spread message.', { data });

    // Call create Spread microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Spread message sent.', { result });
  }
}
