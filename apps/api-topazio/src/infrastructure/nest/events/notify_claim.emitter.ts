import { Logger } from 'winston';

import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/api-topazio/infrastructure';
import {
  NotifyClaimControllerEvent,
  NotifyClaimEventEmitterControllerInterface,
  NotifyClaimEventType,
} from '@zro/api-topazio/interface';

const eventMapper = KAFKA_EVENTS.NOTIFY_CLAIM;

type NotifyClaimKafkaEvent = KafkaMessage<NotifyClaimControllerEvent>;

/**
 * ApiTopazio microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class NotifyClaimEventKafkaEmitter
  implements NotifyClaimEventEmitterControllerInterface
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
    this.logger = logger.child({ context: NotifyClaimEventKafkaEmitter.name });
  }

  /**
   * Call ApiTopazio microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitClaimEvent(
    eventName: NotifyClaimEventType,
    event: NotifyClaimControllerEvent,
  ): void {
    // Request Kafka message.
    const data: NotifyClaimKafkaEvent = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit notify event.', { data });

    // Call create ApiTopazio microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Notify event emitted.', { result });
  }
}
