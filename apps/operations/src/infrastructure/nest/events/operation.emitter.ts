import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import {
  OperationControllerEvent,
  OperationEventEmitterControllerInterface,
  OperationEventType,
} from '@zro/operations/interface';
import { KAFKA_EVENTS } from '@zro/operations/infrastructure';

const eventMapper = KAFKA_EVENTS.OPERATION;

type OperationKafkaEvent = KafkaMessage<OperationControllerEvent>;

/**
 * Operation microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class OperationEventKafkaEmitter
  implements OperationEventEmitterControllerInterface
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
    this.logger = logger.child({ context: OperationEventKafkaEmitter.name });
  }

  /**
   * Call Operation microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitOperationEvent(
    eventName: OperationEventType,
    event: OperationControllerEvent,
  ): void {
    // Request Kafka message.
    const data: OperationKafkaEvent = {
      key: `${
        event.ownerOperation?.ownerId ??
        event.beneficiaryOperation?.beneficiaryId ??
        null
      }`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit Operation event.', { data });

    // Emit event to Operation microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Operation event emitted.', { result });
  }
}
