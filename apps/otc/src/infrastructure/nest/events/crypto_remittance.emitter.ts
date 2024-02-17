import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  CryptoRemittanceControllerEvent,
  CryptoRemittanceEventEmitterControllerInterface,
  CryptoRemittanceEventType,
} from '@zro/otc/interface';

const eventMapper = KAFKA_EVENTS.CRYPTO_REMITTANCE;

type CryptoRemittanceKafkaEvent = KafkaMessage<CryptoRemittanceControllerEvent>;

/**
 * CryptoRemittance microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class CryptoRemittanceEventKafkaEmitter
  implements CryptoRemittanceEventEmitterControllerInterface
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
      context: CryptoRemittanceEventKafkaEmitter.name,
    });
  }

  /**
   * Call CryptoRemittance microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitCryptoRemittanceEvent(
    eventName: CryptoRemittanceEventType,
    event: CryptoRemittanceControllerEvent,
  ): void {
    // Request Kafka message.
    const data: CryptoRemittanceKafkaEvent = {
      key: `${event.baseCurrency}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit CryptoRemittance event.', { data });

    // Emit event to CryptoRemittance microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('CryptoRemittance event emitted.', { result });
  }
}
