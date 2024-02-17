import { Logger } from 'winston';
import { KafkaCreateEvent, KafkaEventEmitter, KafkaMessage } from '@zro/common';
import {
  BotOtcOrderControllerEvent,
  BotOtcOrderEventEmitterControllerInterface,
  BotOtcOrderEventType,
} from '@zro/otc-bot/interface';
import { KAFKA_EVENTS } from '@zro/otc-bot/infrastructure';

const eventMapper = KAFKA_EVENTS.BOT_OTC_ORDER;

type BotOtcOrderKafkaEvent = KafkaMessage<BotOtcOrderControllerEvent>;

/**
 * BotOtcOrder microservice.
 */
@KafkaCreateEvent(Object.values(eventMapper))
export class BotOtcOrderEventKafkaEmitter
  implements BotOtcOrderEventEmitterControllerInterface
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
    this.logger = logger.child({ context: BotOtcOrderEventKafkaEmitter.name });
  }

  /**
   * Call BotOtcOrder microservice to emit message.
   * @param eventName The event name.
   * @param event The event data.
   */
  emitBotOtcOrderEvent(
    eventName: BotOtcOrderEventType,
    event: BotOtcOrderControllerEvent,
  ): void {
    // Request Kafka message.
    const data: BotOtcOrderKafkaEvent = {
      key: `${event.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Emit BotOtcOrder event.', { data });

    // Emit event to BotOtcOrder microservice.
    const result = this.eventEmitter.emit({
      name: eventMapper[eventName],
      data,
    });

    this.logger.debug('BotOtcOrder event emitted.', { result });
  }
}
