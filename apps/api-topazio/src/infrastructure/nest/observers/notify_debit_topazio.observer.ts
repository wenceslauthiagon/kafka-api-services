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
} from '@zro/common';
import { NotifyDebitRepository } from '@zro/api-topazio/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyDebitDatabaseRepository,
  NotifyDebitEventKafkaEmitter,
} from '@zro/api-topazio/infrastructure';
import {
  NotifyDebitEventEmitterControllerInterface,
  HandleFailedNotifyDebitTopazioEventController,
  HandleNotifyDebitTopazioEventController,
  HandleNotifyDebitTopazioEventRequest,
} from '@zro/api-topazio/interface';

export type HandleNotifyDebitTopazioEventKafkaRequest =
  KafkaMessage<HandleNotifyDebitTopazioEventRequest>;

/**
 * Notify debit topazio observer.
 */
@Controller()
@ObserverController()
export class NotifyDebitTopazioNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.NOTIFY_DEBIT.PAYMENT_GATEWAY,
      KAFKA_HUB.NOTIFY_DEBIT.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify debit.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.TOPAZIO.NOTIFY_DEBIT)
  async handleNotifyDebitTopazioEvent(
    @Payload('value') message: HandleNotifyDebitTopazioEventRequest,
    @LoggerParam(NotifyDebitTopazioNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify debit event.', { value: message });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.NOTIFY_DEBIT.PAYMENT_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify debit.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_DEBIT.PAYMENT_GATEWAY)
  async handleNotifyDebitTopazioEventViaPixPayment(
    @Payload('value') message: HandleNotifyDebitTopazioEventRequest,
    @LoggerParam(NotifyDebitTopazioNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyDebitDatabaseRepository)
    notifyDebitRepository: NotifyDebitRepository,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyDebitTopazioEventRequest(message);

    logger.debug('Handle create debit event.', { payload });

    const controller = new HandleNotifyDebitTopazioEventController(
      logger,
      notifyDebitRepository,
    );

    try {
      // Call the pix controller.
      await controller.execute(payload);

      logger.debug('Success to notify debit process.');
    } catch (error) {
      logger.error('Failed to notify debit process.', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.NOTIFY_DEBIT.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Topazio dead letter event. Notify debit here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_DEBIT.DEAD_LETTER)
  async handleNotifyDebitTopazioDeadLetterEvent(
    @Payload('value') message: HandleNotifyDebitTopazioEventRequest,
    @LoggerParam(NotifyDebitTopazioNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyDebitDatabaseRepository)
    notifyDebitRepository: NotifyDebitRepository,
    @EventEmitterParam(NotifyDebitEventKafkaEmitter)
    eventEmitter: NotifyDebitEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyDebitTopazioEventRequest(message);

    logger.debug('Handle failed debit event.', { payload });

    const controller = new HandleFailedNotifyDebitTopazioEventController(
      logger,
      notifyDebitRepository,
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
