import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  RepositoryParam,
  KafkaService,
  EventEmitterParam,
  KafkaServiceParam,
  TranslateService,
} from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditRepository,
} from '@zro/api-topazio/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyCreditDatabaseRepository,
  NotifyCreditEventKafkaEmitter,
  PixPaymentServiceKafka,
  FailedNotifyCreditDatabaseRepository,
} from '@zro/api-topazio/infrastructure';
import {
  HandleNotifyCreditTopazioEventController,
  HandleNotifyCreditTopazioEventRequest,
  HandleFailedNotifyCreditTopazioEventController,
  NotifyCreditEventEmitterControllerInterface,
} from '@zro/api-topazio/interface';

export type HandleNotifyCreditTopazioEventKafkaRequest =
  KafkaMessage<HandleNotifyCreditTopazioEventRequest>;

/**
 * Notify credit topazio observer.
 */
@Controller()
@ObserverController()
export class NotifyCreditTopazioNestObserver {
  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {
    this.kafkaService.createEvents([
      KAFKA_HUB.NOTIFY_CREDIT.PAYMENT_GATEWAY,
      KAFKA_HUB.NOTIFY_CREDIT.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify credit.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.TOPAZIO.NOTIFY_CREDIT)
  async handleNotifyCreditTopazioEvent(
    @Payload('value') message: HandleNotifyCreditTopazioEventRequest,
    @LoggerParam(NotifyCreditTopazioNestObserver) logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify credit event.', { value: message });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.NOTIFY_CREDIT.PAYMENT_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify credit.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_CREDIT.PAYMENT_GATEWAY)
  async handleNotifyCreditTopazioEventViaPixPayment(
    @Payload('value') message: HandleNotifyCreditTopazioEventRequest,
    @LoggerParam(NotifyCreditTopazioNestObserver) logger: Logger,
    @RepositoryParam(NotifyCreditDatabaseRepository)
    notifyCreditRepository: NotifyCreditRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @RepositoryParam(FailedNotifyCreditDatabaseRepository)
    failedNotifyCreditRepository: FailedNotifyCreditRepository,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCreditTopazioEventRequest(message);

    logger.debug('Handle create credit event.', { payload });

    const controller = new HandleNotifyCreditTopazioEventController(
      logger,
      notifyCreditRepository,
      pixPaymentService,
      failedNotifyCreditRepository,
      this.translateService,
    );

    try {
      // Call the pix controller.
      await controller.execute(payload);

      logger.debug('Success to notify credit process.');
    } catch (error) {
      logger.error('Failed to notify credit process.', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.NOTIFY_CREDIT.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Topazio dead letter event. Notify credit here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_CREDIT.DEAD_LETTER)
  async handleNotifyCreditTopazioDeadLetterEvent(
    @Payload('value') message: HandleNotifyCreditTopazioEventRequest,
    @LoggerParam(NotifyCreditTopazioNestObserver) logger: Logger,
    @RepositoryParam(NotifyCreditDatabaseRepository)
    notifyCreditRepository: NotifyCreditRepository,
    @EventEmitterParam(NotifyCreditEventKafkaEmitter)
    eventEmitter: NotifyCreditEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCreditTopazioEventRequest(message);

    logger.debug('Handle failed credit event.', { payload });

    const controller = new HandleFailedNotifyCreditTopazioEventController(
      logger,
      notifyCreditRepository,
      eventEmitter,
    );

    try {
      // Call the notify controller.
      await controller.execute(payload);

      logger.debug('Success to save fail notify.');
    } catch (error) {
      logger.error('Failed to save a fail notify.', { error });
    }
  }
}
