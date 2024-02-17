import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { IsEnum, IsString, IsOptional, IsUUID, IsEmail } from 'class-validator';
import { KafkaMessage, KafkaService, KafkaEventEmitter } from '@zro/common';
import { EmailState } from '@zro/notifications/domain';
import {
  KAFKA_EVENTS,
  EmailCreatedEventKafka,
} from '@zro/notifications/infrastructure';
import {
  EmailAttr,
  EmailEventEmitterController,
} from '@zro/notifications/interface';

/**
 * E-mail request DTO used to class validation.
 */
export class EmailFailedEventDto implements EmailAttr {
  @IsUUID()
  id: string;

  @IsEmail()
  to: string;

  @IsEmail()
  from: string;

  @IsEnum(EmailState)
  state: EmailState;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  html?: string;

  constructor(props: EmailAttr) {
    Object.assign(this, props);
  }
}

/**
 *
 */
export type EmailFailedEventKafka = KafkaMessage<EmailAttr>;

/**
 * Create e-mail events topics on kafka during initialization.
 */
@Injectable()
export class EmailKafkaEmitterInit {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_EVENTS.EMAIL.CREATED,
      KAFKA_EVENTS.EMAIL.SENT,
      KAFKA_EVENTS.EMAIL.FAILED,
    ]);
  }
}

/**
 * Email event emitter.
 */
export class EmailEventKafkaEmitter implements EmailEventEmitterController {
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
    this.logger = logger.child({ context: EmailEventKafkaEmitter.name });
  }

  async emitEmailCreatedEvent(event: EmailAttr): Promise<void> {
    // Request Kafka message.
    const payload: EmailCreatedEventKafka = {
      key: `${event?.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Sending e-mail created event to kafka.', { payload });

    // Call create E-mail microservice.
    const result = await this.eventEmitter.emit({
      name: KAFKA_EVENTS.EMAIL.CREATED,
      data: payload,
    });

    this.logger.debug('Sent e-mail created event to kafka.', { result });
  }

  async emitEmailSentEvent(event: EmailAttr): Promise<void> {
    // Request Kafka message.
    const payload: EmailCreatedEventKafka = {
      key: `${event?.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Sending e-mail sent event to kafka.', { payload });

    // Call create E-mail microservice.
    const result = await this.eventEmitter.emit({
      name: KAFKA_EVENTS.EMAIL.SENT,
      data: payload,
    });

    this.logger.debug('Sent e-mail sent event to kafka.', { result });
  }

  async emitEmailFailedEvent(event: EmailAttr): Promise<void> {
    // Request Kafka message.
    const payload: EmailFailedEventKafka = {
      key: `${event?.id}`,
      headers: { requestId: this.requestId },
      value: event,
    };

    this.logger.debug('Sending e-mail failed event to kafka.', { payload });

    // Call create E-mail microservice.
    const result = await this.eventEmitter.emit({
      name: KAFKA_EVENTS.EMAIL.FAILED,
      data: payload,
    });

    this.logger.debug('Sent e-mail failed event to kafka.', { result });
  }
}
