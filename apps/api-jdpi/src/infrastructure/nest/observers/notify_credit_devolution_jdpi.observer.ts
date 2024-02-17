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
  KafkaServiceParam,
  EventEmitterParam,
  TranslateService,
} from '@zro/common';
import {
  FailedNotifyCreditRepository,
  NotifyCreditDevolutionRepository,
} from '@zro/api-jdpi/domain';
import {
  HandleFailedNotifyCreditDevolutionJdpiEventController,
  HandleFailedNotifyCreditDevolutionJdpiEventRequest,
  HandleNotifyCreditDevolutionJdpiEventController,
  HandleNotifyCreditDevolutionJdpiEventRequest,
  NotifyCreditDevolutionEventEmitterControllerInterface,
} from '@zro/api-jdpi/interface';
import {
  NotifyCreditDevolutionDatabaseRepository,
  PixPaymentServiceKafka,
  NotifyCreditDevolutionEventKafkaEmitter,
  FailedNotifyCreditDatabaseRepository,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/api-jdpi/infrastructure';

export type HandleNotifyCreditDevolutionJdpiEventKafkaRequest =
  KafkaMessage<HandleNotifyCreditDevolutionJdpiEventRequest>;

/**
 * Notify credit devolution Jdpi observer.
 */
@Controller()
@ObserverController()
export class NotifyCreditDevolutionJdpiNestObserver {
  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {
    this.kafkaService.createEvents([
      KAFKA_HUB.NOTIFY_DEVOLUTION.PAYMENT_GATEWAY,
      KAFKA_HUB.NOTIFY_DEVOLUTION.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify credit devolution.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.JDPI.NOTIFY_DEVOLUTION)
  async handleNotifyCreditDevolutionEvent(
    @Payload('value') message: HandleNotifyCreditDevolutionJdpiEventRequest,
    @LoggerParam(NotifyCreditDevolutionJdpiNestObserver) logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify credit devolutin event.', { value: message });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.NOTIFY_DEVOLUTION.PAYMENT_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify credit devolution.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @param failedNotifyCreditRepository Failed notify credit repository.
   * @param notifyCreditDevolutionRepository Notify credit devolution repository.
   * @param pixPaymentService Pix payment service.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_DEVOLUTION.PAYMENT_GATEWAY)
  async handleNotifyCreditDevolutionEventViaPixPayment(
    @Payload('value') message: HandleNotifyCreditDevolutionJdpiEventRequest,
    @LoggerParam(NotifyCreditDevolutionJdpiNestObserver) logger: Logger,
    @RepositoryParam(FailedNotifyCreditDatabaseRepository)
    failedNotifyCreditRepository: FailedNotifyCreditRepository,
    @RepositoryParam(NotifyCreditDevolutionDatabaseRepository)
    notifyCreditDevolutionRepository: NotifyCreditDevolutionRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCreditDevolutionJdpiEventRequest(message);

    logger.debug('Handle notify credit devolution event.', { payload });

    const controller = new HandleNotifyCreditDevolutionJdpiEventController(
      logger,
      notifyCreditDevolutionRepository,
      pixPaymentService,
      failedNotifyCreditRepository,
      this.translateService,
    );

    try {
      // Call the pix controller.
      await controller.execute(payload);

      logger.debug('Success to notify credit devolution process.');
    } catch (error) {
      logger.error('Failed to notify credit devolution process.', error);

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.NOTIFY_DEVOLUTION.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Jdpi dead letter event. Notify credit devolution here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @param notifyCreditDevolutionRepository Notify credit devolution repository.
   * @param eventEmitter Notify credit devolution event emitter.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_DEVOLUTION.DEAD_LETTER)
  async handleNotifyCreditDevolutionDeadLetterEvent(
    @Payload('value')
    message: HandleFailedNotifyCreditDevolutionJdpiEventRequest,
    @LoggerParam(NotifyCreditDevolutionJdpiNestObserver) logger: Logger,
    @RepositoryParam(NotifyCreditDevolutionDatabaseRepository)
    notifyCreditDevolutionRepository: NotifyCreditDevolutionRepository,
    @EventEmitterParam(NotifyCreditDevolutionEventKafkaEmitter)
    eventEmitter: NotifyCreditDevolutionEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleFailedNotifyCreditDevolutionJdpiEventRequest(
      message,
    );

    logger.debug('Handle failed credit devolution event.', { payload });

    const controller =
      new HandleFailedNotifyCreditDevolutionJdpiEventController(
        logger,
        notifyCreditDevolutionRepository,
        eventEmitter,
      );

    try {
      // Call the notify controller.
      await controller.execute(payload);

      logger.debug('Success to save fail notify.');
    } catch (error) {
      logger.error('Failed to save a fail notify.', error);
    }
  }
}
