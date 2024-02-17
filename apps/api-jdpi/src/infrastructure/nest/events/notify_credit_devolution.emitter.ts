import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/api-jdpi/infrastructure';
import {
  NotifyCreditDevolutionControllerEvent,
  NotifyCreditDevolutionEventEmitterControllerInterface,
  NotifyCreditDevolutionEventType,
} from '@zro/api-jdpi/interface';

const eventMapper = KAFKA_EVENTS.NOTIFY_DEVOLUTION;

type NotifyCreditDevolutionKafkaEvent =
  KafkaMessage<NotifyCreditDevolutionControllerEvent>;

/**
 * ApiJdpi microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class NotifyCreditDevolutionEventKafkaEmitter
  implements NotifyCreditDevolutionEventEmitterControllerInterface
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
      context: NotifyCreditDevolutionEventKafkaEmitter.name,
    });
  }

  /**
   * Call ApiJdpi microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitCreditDevolutionEvent(
    eventName: NotifyCreditDevolutionEventType,
    event: NotifyCreditDevolutionControllerEvent,
  ): void {
    // Request Kafka message.
    const data: NotifyCreditDevolutionKafkaEvent = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit notify event.', { data });

    // Call create ApiJdpi microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Notify event emitted.', { result });
  }
}
