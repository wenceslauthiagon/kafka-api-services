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
import { NotifyPixFraudDetectionIssueRepository } from '@zro/api-jira/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyPixFraudDetectionIssueEventKafkaEmitter,
  NotifyPixFraudDetectionIssueDatabaseRepository,
  PixPaymentServiceKafka,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdatePixFraudDetectionIssueEventController,
  HandleFailedNotifyUpdatePixFraudDetectionIssueEventController,
  HandleNotifyUpdatePixFraudDetectionIssueEventRequest,
  NotifyPixFraudDetectionIssueEventEmitterControllerInterface,
} from '@zro/api-jira/interface';

export type HandleNotifyUpdatePixFraudDetectionIssueEventKafkaRequest =
  KafkaMessage<HandleNotifyUpdatePixFraudDetectionIssueEventRequest>;

/**
 * Notify update issue observer.
 */
@Controller()
@ObserverController()
export class NotifyUpdatePixFraudDetectionIssueNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE.PAYMENT_GATEWAY,
      KAFKA_HUB.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify update.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE)
  async handleNotifyUpdatePixFraudDetectionIssueEvent(
    @Payload('value')
    message: HandleNotifyUpdatePixFraudDetectionIssueEventRequest,
    @LoggerParam(NotifyUpdatePixFraudDetectionIssueNestObserver) logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify update issue event.', {
      value: message,
    });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE.PAYMENT_GATEWAY,
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
  @KafkaEventPattern(
    KAFKA_HUB.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE.PAYMENT_GATEWAY,
  )
  async handleNotifyUpdatePixFraudDetectionIssueEventViaPixPayment(
    @Payload('value')
    message: HandleNotifyUpdatePixFraudDetectionIssueEventRequest,
    @LoggerParam(NotifyUpdatePixFraudDetectionIssueNestObserver) logger: Logger,
    @RepositoryParam(NotifyPixFraudDetectionIssueDatabaseRepository)
    notifyIssueRepository: NotifyPixFraudDetectionIssueRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdatePixFraudDetectionIssueEventRequest(
      message,
    );

    logger.debug('Handle notify update issue event.', { payload });

    const controller =
      new HandleNotifyUpdatePixFraudDetectionIssueEventController(
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
        KAFKA_HUB.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE.DEAD_LETTER,
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
  @KafkaEventPattern(KAFKA_HUB.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE.DEAD_LETTER)
  async handleNotifyUpdatePixFraudDetectionIssueDeadLetterEvent(
    @Payload('value')
    message: HandleNotifyUpdatePixFraudDetectionIssueEventRequest,
    @LoggerParam(NotifyUpdatePixFraudDetectionIssueNestObserver) logger: Logger,
    @RepositoryParam(NotifyPixFraudDetectionIssueDatabaseRepository)
    notifyIssueRepository: NotifyPixFraudDetectionIssueRepository,
    @EventEmitterParam(NotifyPixFraudDetectionIssueEventKafkaEmitter)
    eventEmitter: NotifyPixFraudDetectionIssueEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdatePixFraudDetectionIssueEventRequest(
      message,
    );

    logger.debug('Handle failed update issue event.', { payload });

    const controller =
      new HandleFailedNotifyUpdatePixFraudDetectionIssueEventController(
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
