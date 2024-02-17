import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';

import { KafkaService, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  ExchangeContractEventEmitterControllerInterface,
  ExchangeContractEventType,
} from '@zro/otc/interface';
import { ExchangeContractEvent } from '@zro/otc/application';

const eventMapper = {
  [ExchangeContractEventType.CREATED]: KAFKA_EVENTS.EXCHANGE_CONTRACT.CREATED,
};

@Injectable()
export class ExchangeContractEventKafkaEmitterInit {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents(Object.values(eventMapper));
  }
}

/**
 * Exchange Contract microservice.
 */
export class ExchangeContractEventKafkaEmitter
  implements ExchangeContractEventEmitterControllerInterface
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
      context: ExchangeContractEventKafkaEmitter.name,
    });
  }

  /**
   * Call exchange contract microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitExchangeContractEvent<T extends ExchangeContractEvent>(
    eventName: ExchangeContractEventType,
    event: T,
  ): void {
    // Request Kafka message.
    const data: KafkaMessage<T> = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Send Exchange Contract message.', { data });

    // Call exchange contract microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Exchange contract message sent.', { result });
  }
}
