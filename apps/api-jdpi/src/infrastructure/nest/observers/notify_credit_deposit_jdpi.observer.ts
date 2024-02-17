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
  NotifyCreditDepositRepository,
} from '@zro/api-jdpi/domain';
import {
  NotifyCreditDepositDatabaseRepository,
  NotifyCreditDepositEventKafkaEmitter,
  PixPaymentServiceKafka,
  FailedNotifyCreditDatabaseRepository,
  KAFKA_HUB,
  KAFKA_EVENTS,
} from '@zro/api-jdpi/infrastructure';
import {
  HandleNotifyCreditDepositJdpiEventController,
  HandleNotifyCreditDepositJdpiEventRequest,
  HandleFailedNotifyCreditDepositJdpiEventController,
  NotifyCreditDepositEventEmitterControllerInterface,
} from '@zro/api-jdpi/interface';

export type HandleNotifyCreditDepositJdpiEventKafkaRequest =
  KafkaMessage<HandleNotifyCreditDepositJdpiEventRequest>;

/**
 * Notify credit deposit jdpi observer.
 */
@Controller()
@ObserverController()
export class NotifyCreditDepositJdpiNestObserver {
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
   * Handler triggered when notify credit deposit.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.JDPI.NOTIFY_CREDIT)
  async handleNotifyCreditDepositJdpiEvent(
    @Payload('value') message: HandleNotifyCreditDepositJdpiEventRequest,
    @LoggerParam(NotifyCreditDepositJdpiNestObserver) logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify credit deposit event.', { value: message });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.NOTIFY_CREDIT.PAYMENT_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify credit deposit.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @param notifyCreditDepositRepository Notify credit deposit repository.
   * @param pixPaymentService Pix payment service.
   * @param failedNotifyCreditRepository Failed notify credit repository.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_CREDIT.PAYMENT_GATEWAY)
  async handleNotifyCreditDepositJdpiEventViaPixPayment(
    @Payload('value') message: HandleNotifyCreditDepositJdpiEventRequest,
    @LoggerParam(NotifyCreditDepositJdpiNestObserver) logger: Logger,
    @RepositoryParam(NotifyCreditDepositDatabaseRepository)
    notifyCreditDepositRepository: NotifyCreditDepositRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @RepositoryParam(FailedNotifyCreditDatabaseRepository)
    failedNotifyCreditRepository: FailedNotifyCreditRepository,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCreditDepositJdpiEventRequest(message);

    logger.debug('Handle create credit deposit event.', { payload });

    const controller = new HandleNotifyCreditDepositJdpiEventController(
      logger,
      notifyCreditDepositRepository,
      pixPaymentService,
      failedNotifyCreditRepository,
      this.translateService,
    );

    try {
      // Call the pix controller.
      await controller.execute(payload);

      logger.debug('Success to notify credit deposit process.');
    } catch (error) {
      logger.error('Failed to notify credit deposit process.', error);

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
   * Handle Jdpi dead letter event. Notify credit deposit here have all retries failed.
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @param notifyCreditDepositRepository Notify credit deposit repository.
   * @param eventEmitter Notify credit deposit event emitter.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_CREDIT.DEAD_LETTER)
  async handleNotifyCreditDepositJdpiDeadLetterEvent(
    @Payload('value') message: HandleNotifyCreditDepositJdpiEventRequest,
    @LoggerParam(NotifyCreditDepositJdpiNestObserver) logger: Logger,
    @RepositoryParam(NotifyCreditDepositDatabaseRepository)
    notifyCreditDepositRepository: NotifyCreditDepositRepository,
    @EventEmitterParam(NotifyCreditDepositEventKafkaEmitter)
    eventEmitter: NotifyCreditDepositEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCreditDepositJdpiEventRequest(message);

    logger.debug('Handle failed credit deposit event.', { payload });

    const controller = new HandleFailedNotifyCreditDepositJdpiEventController(
      logger,
      notifyCreditDepositRepository,
      eventEmitter,
    );

    try {
      // Call the notify controller.
      await controller.execute(payload);

      logger.debug('Success to save a fail notify.');
    } catch (error) {
      logger.error('Failed to save a fail notify.', error);
    }
  }
}
