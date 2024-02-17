import { Logger } from 'winston';

import { KafkaEventEmitter, KafkaMessage, KafkaCreateEvent } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/utils/infrastructure';
import {
  FeatureSettingControllerEvent,
  FeatureSettingEventEmitterControllerInterface,
  FeatureSettingEventType,
} from '@zro/utils/interface';

const eventMapper = KAFKA_EVENTS.FEATURE_SETTING;

type FeatureSettingKafkaEvent = KafkaMessage<FeatureSettingControllerEvent>;

/**
 * Compliance microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class FeatureSettingEventKafkaEmitter
  implements FeatureSettingEventEmitterControllerInterface
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
      context: FeatureSettingEventKafkaEmitter.name,
    });
  }

  /**
   * Call  to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitFeatureSettingEvent(
    eventName: FeatureSettingEventType,
    event: FeatureSettingControllerEvent,
  ): void {
    //  Kafka message.
    const data: FeatureSettingKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit Feature setting event.', { data });

    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Feature setting event emitted.', {
      result,
    });
  }
}
