import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import { Cache, Milliseconds } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import {
  EventEmitterParam,
  GatewayException,
  InjectCache,
  KafkaMessage,
  KafkaEventPattern,
  KafkaService,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { SmsRepository } from '@zro/notifications/domain';
import { SmsGateway } from '@zro/notifications/application';
import {
  SmsDatabaseRepository,
  SmsEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/notifications/infrastructure';
import { DockDecorator, DockInterceptor } from '@zro/dock';
import { ZenviaDecorator, ZenviaInterceptor } from '@zro/zenvia';
import { BulksmsDecorator, BulksmsInterceptor } from '@zro/bulksms';
import {
  SmsEventEmitterController,
  HandleSmsCreatedController,
  HandleCreatedSmsDeadLetterController,
  HandleSmsCreatedRequest,
  HandleCreatedSmsDeadLetterRequest,
} from '@zro/notifications/interface';

export type CreatedSmsEventKafka = KafkaMessage<HandleSmsCreatedRequest>;

export type CreatedSmsDeadLetterEventKafka =
  KafkaMessage<HandleCreatedSmsDeadLetterRequest>;

const providers = [
  KAFKA_HUB.SMS.ZENVIA_GATEWAY,
  KAFKA_HUB.SMS.DOCK_GATEWAY,
  KAFKA_HUB.SMS.BULKSMS_GATEWAY,
];

interface CreatedSmsConfig {
  APP_SEND_SMS_PROVIDER_CACHE_TTL_S: number;
}

/**
 * SMS events observer.
 */
@Controller()
@MicroserviceController([
  ZenviaInterceptor,
  BulksmsInterceptor,
  DockInterceptor,
])
export class CreatedSmsNestObserver {
  private readonly ttl: Milliseconds;

  /**
   * Default sms RPC controller constructor.
   *
   * @param kafkaService
   */
  constructor(
    private kafkaService: KafkaService,
    @InjectCache() private cache: Cache,
    configService: ConfigService<CreatedSmsConfig>,
  ) {
    this.kafkaService.createEvents([...providers, KAFKA_HUB.SMS.DEAD_LETTER]);
    this.ttl =
      configService.get<number>('APP_SEND_SMS_PROVIDER_CACHE_TTL_S', 600) *
      1000;
  }

  /**
   * Handle sms created event and send it to gateway hub selector.
   * @param message Event Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.SMS.CREATED)
  async handleSmsCreatedEvent(
    @Payload('value') message: HandleSmsCreatedRequest,
    @LoggerParam(CreatedSmsNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received SMS created event', { event: message });

    const { phoneNumber, issuedBy } = message;

    // Sanity check
    if (!phoneNumber) {
      logger.error('Missing phoneNumber', { smsEvent: message });
      await this.kafkaService.emit(KAFKA_HUB.SMS.DEAD_LETTER, ctx.getMessage());
    }

    const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Is a brazilian phone number?
    if (sanitizedNumber.startsWith('55')) {
      // Select first provider as default one.
      let nextProvider = providers[0];

      // Check if user is trying to send same SMS again...
      if (issuedBy) {
        const lastProvider = await this.cache.get<string>(
          `sms-observer-${issuedBy}`,
        );

        // Do I know this SMS?
        if (lastProvider) {
          // Get next available provider (circular list).
          const lastTry = providers.indexOf(lastProvider);
          const nextTry = (lastTry + 1) % providers.length;
          nextProvider = providers[nextTry];
        }

        // I may not know if I sent this SMS but I will remember the next time.
        await this.cache.set(
          `sms-observer-${issuedBy}`,
          nextProvider,
          this.ttl,
        );
      }

      // Send by the next provider.
      return this.kafkaService.emit(nextProvider, ctx.getMessage());
    } else {
      // International phones always goes through BulkSms. No cache needed.
      return this.kafkaService.emit(
        KAFKA_HUB.SMS.BULKSMS_GATEWAY,
        ctx.getMessage(),
      );
    }
  }

  /**
   * Handle SMS created event and send it via Zenvia.
   *
   * @param message Event Kafka message.
   * @param smsRepository SMS repository.
   * @param smsEventEmitter E-mai event emitter.
   * @param logger Local logger instance.
   * @param smsGateway SMTP gateway.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.SMS.ZENVIA_GATEWAY)
  async handleSmsCreatedEventViaZenvia(
    @Payload('value') message: HandleSmsCreatedRequest,
    @RepositoryParam(SmsDatabaseRepository)
    smsRepository: SmsRepository,
    @EventEmitterParam(SmsEventKafkaEmitter)
    smsEventEmitter: SmsEventEmitterController,
    @LoggerParam(CreatedSmsNestObserver)
    logger: Logger,
    @ZenviaDecorator() smsGateway: SmsGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleSmsCreatedRequest(message);

    logger.debug('Sending SMS via Zenvia.', { payload });

    try {
      const controller = new HandleSmsCreatedController(
        smsRepository,
        smsEventEmitter,
        smsGateway,
        logger,
      );

      // Send sms
      await controller.execute(payload);
    } catch (error) {
      logger.error(
        'Failed to send SMS via Zenvia',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      // Try on Dock gateway.
      await this.kafkaService.emit(
        KAFKA_HUB.SMS.DOCK_GATEWAY,
        ctx.getMessage(),
      );
    }
  }

  /**
   * Handle SMS created event and send it via Dock.
   *
   * @param message Event Kafka message.
   * @param smsRepository SMS repository.
   * @param smsEventEmitter E-mai event emitter.
   * @param logger Local logger instance.
   * @param smsGateway SMTP gateway.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.SMS.DOCK_GATEWAY)
  async handleSmsCreatedEventViaDock(
    @Payload('value') message: HandleSmsCreatedRequest,
    @RepositoryParam(SmsDatabaseRepository)
    smsRepository: SmsRepository,
    @EventEmitterParam(SmsEventKafkaEmitter)
    smsEventEmitter: SmsEventEmitterController,
    @LoggerParam(CreatedSmsNestObserver)
    logger: Logger,
    @DockDecorator() smsGateway: SmsGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleSmsCreatedRequest(message);

    logger.debug('Sending SMS via Bulksms.', { payload });

    try {
      const controller = new HandleSmsCreatedController(
        smsRepository,
        smsEventEmitter,
        smsGateway,
        logger,
      );

      // Send sms
      await controller.execute(payload);
    } catch (error) {
      logger.error(
        'Failed to send SMS via Dock',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      // Try on Bulksms gateway.
      await this.kafkaService.emit(
        KAFKA_HUB.SMS.BULKSMS_GATEWAY,
        ctx.getMessage(),
      );
    }
  }

  /**
   * Handle SMS created event and send it via Bulksms.
   *
   * @param message Event Kafka message.
   * @param smsRepository SMS repository.
   * @param smsEventEmitter E-mai event emitter.
   * @param logger Local logger instance.
   * @param smsGateway SMTP gateway.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.SMS.BULKSMS_GATEWAY)
  async handleSmsCreatedEventViaBulksms(
    @Payload('value') message: HandleSmsCreatedRequest,
    @RepositoryParam(SmsDatabaseRepository)
    smsRepository: SmsRepository,
    @EventEmitterParam(SmsEventKafkaEmitter)
    smsEventEmitter: SmsEventEmitterController,
    @LoggerParam(CreatedSmsNestObserver)
    logger: Logger,
    @BulksmsDecorator() smsGateway: SmsGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleSmsCreatedRequest(message);

    logger.debug('Sending SMS via Bulksms.', { payload });

    try {
      const controller = new HandleSmsCreatedController(
        smsRepository,
        smsEventEmitter,
        smsGateway,
        logger,
      );

      // Send sms
      await controller.execute(payload);
    } catch (error) {
      logger.error(
        'Failed to send SMS via Bulksms',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      if (error instanceof GatewayException) {
        await this.kafkaService.emit(
          KAFKA_HUB.SMS.DEAD_LETTER,
          ctx.getMessage(),
        );
      }
    }
  }

  /**
   * Handle sms dead letter event. SMSs here failed to all retries.
   *
   * @param message Event Kafka message.
   * @param smsRepository SMS repository.
   * @param smsEventEmitter E-mai event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.SMS.DEAD_LETTER)
  async handleSmsDeadLetterEvent(
    @Payload('value') message: HandleCreatedSmsDeadLetterRequest,
    @RepositoryParam(SmsDatabaseRepository)
    smsRepository: SmsRepository,
    @EventEmitterParam(SmsEventKafkaEmitter)
    smsEventEmitter: SmsEventEmitterController,
    @LoggerParam(CreatedSmsNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCreatedSmsDeadLetterRequest(message);

    logger.debug('Failing SMS.', { payload });

    try {
      const controller = new HandleCreatedSmsDeadLetterController(
        smsRepository,
        smsEventEmitter,
        logger,
      );

      // Fail sms.
      await controller.execute(payload);
    } catch (error) {
      logger.error('Failed to fail sms', { error });

      // FIXME: Should notify IT team.
    }
  }
}
