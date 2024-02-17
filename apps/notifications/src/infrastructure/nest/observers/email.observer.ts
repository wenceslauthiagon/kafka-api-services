import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { IsEnum, IsString, IsOptional, IsUUID, IsEmail } from 'class-validator';
import {
  EventEmitterParam,
  InjectValidator,
  KafkaMessage,
  KafkaEventPattern,
  KafkaService,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { EmailRepository, EmailState } from '@zro/notifications/domain';
import { SmtpGateway } from '@zro/notifications/application';
import {
  EmailDatabaseRepository,
  EmailEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/notifications/infrastructure';
import {
  EmailAttr,
  EmailEventEmitterController,
  HandleEmailCreatedController,
  HandleEmailDeadLetterController,
} from '@zro/notifications/interface';
import { MatracaDecorator, MatracaInterceptor } from '@zro/matraca';

/**
 * E-mail request DTO used to class validation.
 */
export class EmailCreatedEventDto implements EmailAttr {
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

export type EmailCreatedEventKafka = KafkaMessage<EmailAttr>;

/**
 * E-mail request DTO used to class validation.
 */
export class EmailDeadLetterEventDto implements EmailAttr {
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

export type EmailDeadLetterEventKafka = KafkaMessage<EmailAttr>;

/**
 * E-mail events observer.
 */
@Controller()
@MicroserviceController([MatracaInterceptor])
export class EmailNestObserver {
  /**
   * Default email RPC controller constructor.
   *
   * @param validate
   * @param kafkaService
   */
  constructor(
    @InjectValidator() private validate: Validator,
    private kafkaService: KafkaService,
  ) {
    this.kafkaService.createEvents([KAFKA_HUB.EMAIL.DEAD_LETTER]);
  }

  /**
   * Handle e-mail created event and send it to gateway hub selector.
   * @param message Event Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.EMAIL.CREATED)
  async handleEmailCreatedEvent(
    @Payload('value') message: EmailCreatedEventDto,
    @LoggerParam(EmailNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ) {
    logger.debug('Received e-mail created event', { event: message });

    // Select matraca gateway to send e-mail.
    await this.kafkaService.emit(
      KAFKA_HUB.EMAIL.MATRACA_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handle e-mail created event and send it via Matraca.
   *
   * @param message Event Kafka message.
   * @param emailRepository E-mail repository.
   * @param emailEventEmitter E-mai event emitter.
   * @param logger Local logger instance.
   * @param smtpGateway SmtpGateway implementation.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.EMAIL.MATRACA_GATEWAY)
  async handleEmailCreatedEventViaMatraca(
    @Payload('value') message: EmailCreatedEventDto,
    @RepositoryParam(EmailDatabaseRepository)
    emailRepository: EmailRepository,
    @EventEmitterParam(EmailEventKafkaEmitter)
    emailEventEmitter: EmailEventEmitterController,
    @LoggerParam(EmailNestObserver)
    logger: Logger,
    @MatracaDecorator() smtpGateway: SmtpGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new EmailCreatedEventDto(message);
    await this.validate(payload);

    const { id } = payload;

    logger.debug('Sending e-mail via Matraca.', { payload });

    try {
      const controller = new HandleEmailCreatedController(
        emailRepository,
        emailEventEmitter,
        smtpGateway,
        logger,
      );

      // Send e-mail
      await controller.execute(id);
    } catch (error) {
      logger.error('Failed to send e-mail', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.EMAIL.DEAD_LETTER,
        ctx.getMessage(),
      );
    }
  }

  /**
   * Handle e-mail dead letter event. E-mails here failed to all retries.
   *
   * @param message Event Kafka message.
   * @param emailRepository E-mail repository.
   * @param emailEventEmitter E-mai event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.EMAIL.DEAD_LETTER)
  async handleEmailDeadLetterEvent(
    @Payload('value') message: EmailDeadLetterEventDto,
    @RepositoryParam(EmailDatabaseRepository)
    emailRepository: EmailRepository,
    @EventEmitterParam(EmailEventKafkaEmitter)
    emailEventEmitter: EmailEventEmitterController,
    @LoggerParam(EmailNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new EmailDeadLetterEventDto(message);
    await this.validate(payload);

    const { id } = payload;

    logger.debug('Failing e-mail.', { payload });

    try {
      const controller = new HandleEmailDeadLetterController(
        emailRepository,
        emailEventEmitter,
        logger,
      );

      // Fail e-mail.
      await controller.execute(id);
    } catch (error) {
      logger.error('Failed to fail e-mail', { error });

      // FIXME: Should notify IT team.
    }
  }
}
