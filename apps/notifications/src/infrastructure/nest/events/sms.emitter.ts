import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { KafkaEventEmitter, KafkaMessage, KafkaService } from '@zro/common';
import {
  KAFKA_EVENTS,
  CreatedSmsEventKafka,
} from '@zro/notifications/infrastructure';
import {
  SmsEvent,
  SmsEventEmitterController,
} from '@zro/notifications/interface';

/**
 * Event sent through Kafka cluster.
 */
export type SmsFailedEventKafka = KafkaMessage<SmsEvent>;

/**
 * Create sms events topics on kafka during initialization.
 */
@Injectable()
export class SmsKafkaEmitterInit {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_EVENTS.SMS.CREATED,
      KAFKA_EVENTS.SMS.SENT,
      KAFKA_EVENTS.SMS.FAILED,
    ]);
  }
}

/**
 * Sms event emitter.
 */
export class SmsEventKafkaEmitter implements SmsEventEmitterController {
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
    this.logger = logger.child({ context: SmsEventKafkaEmitter.name });
  }

  async emitSmsCreatedEvent(event: SmsEvent): Promise<void> {
    // Request Kafka message.
    const payload: CreatedSmsEventKafka = {
      key: `${event?.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Sending SMS created event to kafka.', { payload });

    // Call create SMS microservice.
    const result = await this.eventEmitter.emit({
      name: KAFKA_EVENTS.SMS.CREATED,
      data: payload,
    });

    this.logger.debug('Sent SMS created event to kafka.', { result });
  }

  async emitSmsSentEvent(event: SmsEvent): Promise<void> {
    // Request Kafka message.
    const payload: CreatedSmsEventKafka = {
      key: `${event?.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Sending SMS sent event to kafka.', { payload });

    // Call create SMS microservice.
    const result = await this.eventEmitter.emit({
      name: KAFKA_EVENTS.SMS.SENT,
      data: payload,
    });

    this.logger.debug('Sent SMS sent event to kafka.', { result });
  }

  async emitSmsFailedEvent(event: SmsEvent): Promise<void> {
    // Request Kafka message.
    const payload: SmsFailedEventKafka = {
      key: `${event?.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Sending SMS failed event to kafka.', { payload });

    // Call create SMS microservice.
    const result = await this.eventEmitter.emit({
      name: KAFKA_EVENTS.SMS.FAILED,
      data: payload,
    });

    this.logger.debug('Sent sms failed event to kafka.', { result });
  }
}
