import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/api-jira/infrastructure';
import {
  NotifyPixInfractionIssueControllerEvent,
  NotifyPixInfractionIssueEventEmitterControllerInterface,
  NotifyPixInfractionIssueEventType,
} from '@zro/api-jira/interface';

const eventMapper = KAFKA_EVENTS.NOTIFY_ISSUE.INFRACTION;

type NotifyPixInfractionIssueKafkaEvent =
  KafkaMessage<NotifyPixInfractionIssueControllerEvent>;

/**
 * ApiTopazio microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class NotifyPixInfractionIssueEventKafkaEmitter
  implements NotifyPixInfractionIssueEventEmitterControllerInterface
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
      context: NotifyPixInfractionIssueEventKafkaEmitter.name,
    });
  }

  /**
   * Call ApiTopazio microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitIssueEvent(
    eventName: NotifyPixInfractionIssueEventType,
    event: NotifyPixInfractionIssueControllerEvent,
  ): void {
    // Request Kafka message.
    const data: NotifyPixInfractionIssueKafkaEvent = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit notify event.', { data });

    // Call create ApiJira microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Notify event emitted.', { result });
  }
}
