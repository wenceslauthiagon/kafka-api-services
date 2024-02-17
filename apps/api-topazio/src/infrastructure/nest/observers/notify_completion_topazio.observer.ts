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
} from '@zro/common';
import { NotifyCompletionRepository } from '@zro/api-topazio/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyCompletionDatabaseRepository,
  PixPaymentEventKafkaEmitter,
  PixDevolutionEventKafkaEmitter,
  PixPaymentServiceKafka,
  NotifyCompletionEventKafkaEmitter,
} from '@zro/api-topazio/infrastructure';
import {
  HandleNotifyCompletionTopazioEventController,
  HandleNotifyCompletionTopazioEventRequest,
  PixPaymentEventEmitterControllerInterface,
  PixDevolutionEventEmitterControllerInterface,
  HandleFailedNotifyCompletionTopazioEventController,
  NotifyCompletionEventEmitterControllerInterface,
} from '@zro/api-topazio/interface';

export type HandleNotifyCompletionTopazioEventKafkaRequest =
  KafkaMessage<HandleNotifyCompletionTopazioEventRequest>;

/**
 * Notify completion topazio observer.
 */
@Controller()
@ObserverController()
export class NotifyCompletionTopazioNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.NOTIFY_COMPLETION.PAYMENT_GATEWAY,
      KAFKA_HUB.NOTIFY_COMPLETION.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify completion.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.TOPAZIO.NOTIFY_COMPLETION)
  async handleNotifyCompletionTopazioEvent(
    @Payload('value') message: HandleNotifyCompletionTopazioEventRequest,
    @LoggerParam(NotifyCompletionTopazioNestObserver) logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify completion event.', {
      value: message,
    });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.NOTIFY_COMPLETION.PAYMENT_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify completion.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_COMPLETION.PAYMENT_GATEWAY)
  async handleNotifyCompletionTopazioEventViaPixPayment(
    @Payload('value') message: HandleNotifyCompletionTopazioEventRequest,
    @LoggerParam(NotifyCompletionTopazioNestObserver) logger: Logger,
    @RepositoryParam(NotifyCompletionDatabaseRepository)
    notifyCompletionRepository: NotifyCompletionRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @EventEmitterParam(PixPaymentEventKafkaEmitter)
    pixPaymentEmitter: PixPaymentEventEmitterControllerInterface,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    pixDevolutionEmitter: PixDevolutionEventEmitterControllerInterface,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCompletionTopazioEventRequest(message);

    logger.debug('Handle create completion event.', { payload });

    const controller = new HandleNotifyCompletionTopazioEventController(
      logger,
      notifyCompletionRepository,
      pixPaymentService,
      pixPaymentEmitter,
      pixDevolutionEmitter,
    );

    try {
      // Call the pix controller.
      await controller.execute(payload);

      logger.debug('Success to notify completion process.');
    } catch (error) {
      logger.error('Failed to notify completion process.', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.NOTIFY_COMPLETION.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Topazio dead letter event. Notify completion here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_COMPLETION.DEAD_LETTER)
  async handleNotifyCompletionTopazioDeadLetterEvent(
    @Payload('value') message: HandleNotifyCompletionTopazioEventRequest,
    @LoggerParam(NotifyCompletionTopazioNestObserver) logger: Logger,
    @RepositoryParam(NotifyCompletionDatabaseRepository)
    notifyCompletionRepository: NotifyCompletionRepository,
    @EventEmitterParam(NotifyCompletionEventKafkaEmitter)
    eventEmitter: NotifyCompletionEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCompletionTopazioEventRequest(message);

    logger.debug('Handle failed completion event.', { payload });

    const controller = new HandleFailedNotifyCompletionTopazioEventController(
      logger,
      notifyCompletionRepository,
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
