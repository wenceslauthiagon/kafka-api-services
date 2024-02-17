import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  KafkaService,
  RepositoryParam,
  EventEmitterParam,
  KafkaServiceParam,
} from '@zro/common';
import { NotifyPixRefundIssueRepository } from '@zro/api-jira/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyPixRefundIssueEventKafkaEmitter,
  NotifyPixRefundIssueDatabaseRepository,
  PixPaymentServiceKafka,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdatePixRefundIssueEventController,
  HandleFailedNotifyUpdatePixRefundIssueEventController,
  HandleNotifyUpdatePixRefundIssueEventRequest,
  NotifyPixRefundIssueEventEmitterControllerInterface,
} from '@zro/api-jira/interface';

export type HandleNotifyUpdatePixRefundIssueEventKafkaRequest =
  KafkaMessage<HandleNotifyUpdatePixRefundIssueEventRequest>;

/**
 * Notify update issue observer.
 */
@Controller()
@ObserverController()
export class NotifyUpdatePixRefundIssueNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.ISSUE.REFUND.NOTIFY_UPDATE.PAYMENT_GATEWAY,
      KAFKA_HUB.ISSUE.REFUND.NOTIFY_UPDATE.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify update.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.ISSUE.REFUND.NOTIFY_UPDATE)
  async handleNotifyUpdatePixRefundIssueEvent(
    @Payload('value') message: HandleNotifyUpdatePixRefundIssueEventRequest,
    @LoggerParam(NotifyUpdatePixRefundIssueNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify update issue event.', {
      value: message,
    });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.ISSUE.REFUND.NOTIFY_UPDATE.PAYMENT_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify update issue.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.ISSUE.REFUND.NOTIFY_UPDATE.PAYMENT_GATEWAY)
  async handleNotifyUpdatePixRefundIssueEventViaPixPayment(
    @Payload('value') message: HandleNotifyUpdatePixRefundIssueEventRequest,
    @LoggerParam(NotifyUpdatePixRefundIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyPixRefundIssueDatabaseRepository)
    notifyIssueRepository: NotifyPixRefundIssueRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdatePixRefundIssueEventRequest(message);

    logger.debug('Handle notify update issue event.', { payload });

    const controller = new HandleNotifyUpdatePixRefundIssueEventController(
      logger,
      notifyIssueRepository,
      pixPaymentService,
    );

    try {
      // Call controller.
      await controller.execute(payload);

      logger.debug('Success to notify update process.');
    } catch (error) {
      logger.error('Failed to notify update process.', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.ISSUE.REFUND.NOTIFY_UPDATE.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Issue dead letter event. Notify update here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.ISSUE.REFUND.NOTIFY_UPDATE.DEAD_LETTER)
  async handleNotifyUpdatePixRefundIssueDeadLetterEvent(
    @Payload('value') message: HandleNotifyUpdatePixRefundIssueEventRequest,
    @LoggerParam(NotifyUpdatePixRefundIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyPixRefundIssueDatabaseRepository)
    notifyIssueRepository: NotifyPixRefundIssueRepository,
    @EventEmitterParam(NotifyPixRefundIssueEventKafkaEmitter)
    eventEmitter: NotifyPixRefundIssueEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdatePixRefundIssueEventRequest(message);

    logger.debug('Handle failed update issue event.', { payload });

    const controller =
      new HandleFailedNotifyUpdatePixRefundIssueEventController(
        logger,
        notifyIssueRepository,
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
