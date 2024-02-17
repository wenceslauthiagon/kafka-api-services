import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  WarningPixDepositControllerEvent,
  WarningPixDepositEventEmitterControllerInterface,
  WarningPixDepositEventType,
} from '@zro/pix-payments/interface';

const eventMapper = KAFKA_EVENTS.WARNING_PIX_DEPOSIT;

type WarningPixDepositKafkaEvent =
  KafkaMessage<WarningPixDepositControllerEvent>;

/**
 * WarningPixDeposit microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class WarningPixDepositEventKafkaEmitter
  implements WarningPixDepositEventEmitterControllerInterface
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
      context: WarningPixDepositEventKafkaEmitter.name,
    });
  }

  /**
   * Call PixPayment microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitWarningPixDepositEvent(
    eventName: WarningPixDepositEventType,
    event: WarningPixDepositControllerEvent,
  ): void {
    // Request Kafka message.
    const data: WarningPixDepositKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit warning pix deposit event.', { data });

    // Emit event to PixPayment microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Warning pix deposit event emitted.', { result });
  }
}
