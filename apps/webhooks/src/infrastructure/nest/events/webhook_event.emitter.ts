import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/webhooks/infrastructure';
import {
  WebhookEventControllerEvent,
  WebhookEventEmitterControllerInterface,
  WebhookEventType,
} from '@zro/webhooks/interface';

const eventMapper = KAFKA_EVENTS.WEBHOOK_EVENT;

export type WebhookEventKafkaEvent = KafkaMessage<WebhookEventControllerEvent>;

/**
 * Webhooks microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class WebhookEventEventKafkaEmitter
  implements WebhookEventEmitterControllerInterface
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
    this.logger = logger.child({ context: WebhookEventEventKafkaEmitter.name });
  }

  /**
   * Call Webhooks microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitWebhookEvent(
    eventName: WebhookEventType,
    event: WebhookEventControllerEvent,
  ): void {
    // Request Kafka message.
    const data: WebhookEventKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit webhooks event.', { data });

    // Emit event to Webhooks microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Webhooks event emitted.', { result });
  }
}
