import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import { KAFKA_EVENTS } from '@zro/otc/infrastructure';
import {
  RemittanceExposureRuleControllerEvent,
  RemittanceExposureRuleEventEmitterControllerInterface,
  RemittanceExposureRuleEventType,
} from '@zro/otc/interface';

const eventMapper = KAFKA_EVENTS.REMITTANCE_EXPOSURE_RULE;

type RemittanceExposureRuleKafkaEvent =
  KafkaMessage<RemittanceExposureRuleControllerEvent>;

/**
 * RemittanceExposureRule microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class RemittanceExposureRuleEventKafkaEmitter
  implements RemittanceExposureRuleEventEmitterControllerInterface
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
      context: RemittanceExposureRuleEventKafkaEmitter.name,
    });
  }

  /**
   * Call RemittanceExposureRule microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitRemittanceExposureRuleEvent(
    eventName: RemittanceExposureRuleEventType,
    event: RemittanceExposureRuleControllerEvent,
  ): void {
    // Request Kafka message.
    const data: RemittanceExposureRuleKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit remittance exposure rule event.', { data });

    // Emit event to remittance exposure rule microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('Remittance exposure rule event emitted.', { result });
  }
}
