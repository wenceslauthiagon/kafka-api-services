import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/api-jira/infrastructure';
import {
  NotifyPixFraudDetectionIssueControllerEvent,
  NotifyPixFraudDetectionIssueEventEmitterControllerInterface,
  NotifyPixFraudDetectionIssueEventType,
} from '@zro/api-jira/interface';

const eventMapper = KAFKA_EVENTS.NOTIFY_ISSUE.FRAUD_DETECTION;

type NotifyPixFraudDetectionIssueKafkaEvent =
  KafkaMessage<NotifyPixFraudDetectionIssueControllerEvent>;

/**
 * ApiTopazio microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class NotifyPixFraudDetectionIssueEventKafkaEmitter
  implements NotifyPixFraudDetectionIssueEventEmitterControllerInterface
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
      context: NotifyPixFraudDetectionIssueEventKafkaEmitter.name,
    });
  }

  /**
   * Call ApiTopazio microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitIssueEvent(
    eventName: NotifyPixFraudDetectionIssueEventType,
    event: NotifyPixFraudDetectionIssueControllerEvent,
  ): void {
    // Request Kafka message.
    const data: NotifyPixFraudDetectionIssueKafkaEvent = {
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
