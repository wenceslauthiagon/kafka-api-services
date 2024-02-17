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
import { NotifyWarningTransactionIssueRepository } from '@zro/api-jira/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  ComplianceServiceKafka,
  NotifyWarningTransactionIssueEventKafkaEmitter,
  NotifyWarningTransactionIssueDatabaseRepository,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdateWarningTransactionIssueEventController,
  HandleFailedNotifyUpdateWarningTransactionIssueEventController,
  HandleNotifyUpdateWarningTransactionIssueEventRequest,
  NotifyWarningTransactionIssueEventEmitterControllerInterface,
} from '@zro/api-jira/interface';

export type HandleNotifyUpdateWarningTransactionIssueEventKafkaRequest =
  KafkaMessage<HandleNotifyUpdateWarningTransactionIssueEventRequest>;

/**
 * Notify update warning transaction issue observer.
 */
@Controller()
@ObserverController()
export class NotifyUpdateWarningTransactionIssueNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE.COMPLIANCE_GATEWAY,
      KAFKA_HUB.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify update.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE)
  async handleNotifyUpdateWarningTransactionIssueEvent(
    @Payload('value')
    message: HandleNotifyUpdateWarningTransactionIssueEventKafkaRequest,
    @LoggerParam(NotifyUpdateWarningTransactionIssueNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify update user limit request issue event.', {
      value: message,
    });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE.COMPLIANCE_GATEWAY,
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
    KAFKA_HUB.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE.COMPLIANCE_GATEWAY,
  )
  async handleNotifyUpdateWarningTransactionIssueEventViaPixPayment(
    @Payload('value')
    message: HandleNotifyUpdateWarningTransactionIssueEventRequest,
    @LoggerParam(NotifyUpdateWarningTransactionIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyWarningTransactionIssueDatabaseRepository)
    notifyIssueRepository: NotifyWarningTransactionIssueRepository,
    @KafkaServiceParam(ComplianceServiceKafka)
    complianceService: ComplianceServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdateWarningTransactionIssueEventRequest(
      message,
    );

    logger.debug('Handle notify update issue event.', { payload });

    const controller =
      new HandleNotifyUpdateWarningTransactionIssueEventController(
        logger,
        notifyIssueRepository,
        complianceService,
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
        KAFKA_HUB.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE.DEAD_LETTER,
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
  @KafkaEventPattern(
    KAFKA_HUB.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE.DEAD_LETTER,
  )
  async handleNotifyUpdateWarningTransactionIssueDeadLetterEvent(
    @Payload('value')
    message: HandleNotifyUpdateWarningTransactionIssueEventRequest,
    @LoggerParam(NotifyUpdateWarningTransactionIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyWarningTransactionIssueDatabaseRepository)
    notifyIssueRepository: NotifyWarningTransactionIssueRepository,
    @EventEmitterParam(NotifyWarningTransactionIssueEventKafkaEmitter)
    eventEmitter: NotifyWarningTransactionIssueEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdateWarningTransactionIssueEventRequest(
      message,
    );

    logger.debug('Handle failed update issue event.', { payload });

    const controller =
      new HandleFailedNotifyUpdateWarningTransactionIssueEventController(
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
