import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  KafkaService,
  RepositoryParam,
  KafkaServiceParam,
} from '@zro/common';
import { NotifyUserWithdrawSettingRequestIssueRepository } from '@zro/api-jira/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  ComplianceServiceKafka,
  NotifyUserWithdrawSettingRequestIssueDatabaseRepository,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdateUserWithdrawSettingRequestIssueEventController,
  HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventController,
  HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest,
} from '@zro/api-jira/interface';

export type HandleNotifyUpdateUserWithdrawSettingRequestIssueEventKafkaRequest =
  KafkaMessage<HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest>;

/**
 * Notify update user withdraw setting request issue observer.
 */
@Controller()
@ObserverController()
export class NotifyUpdateUserWithdrawSettingRequestIssueNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE
        .COMPLIANCE_GATEWAY,
      KAFKA_HUB.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify update.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(
    KAFKA_EVENTS.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE,
  )
  async handleNotifyUpdateUserWithdrawSettingRequestIssueEvent(
    @Payload('value')
    message: HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest,
    @LoggerParam(NotifyUpdateUserWithdrawSettingRequestIssueNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug(
      'Received notify update user withdraw setting request issue event.',
      { value: message },
    );

    await this.kafkaService.emit(
      KAFKA_HUB.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE
        .COMPLIANCE_GATEWAY,
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
    KAFKA_HUB.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE
      .COMPLIANCE_GATEWAY,
  )
  async handleNotifyUpdateUserWithdrawSettingRequestIssueEventViaComplianceGateway(
    @Payload('value')
    message: HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest,
    @LoggerParam(NotifyUpdateUserWithdrawSettingRequestIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyUserWithdrawSettingRequestIssueDatabaseRepository)
    notifyIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository,
    @KafkaServiceParam(ComplianceServiceKafka)
    complianceService: ComplianceServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest(
        message,
      );

    logger.debug('Handle notify update issue event.', { payload });

    const controller =
      new HandleNotifyUpdateUserWithdrawSettingRequestIssueEventController(
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
        KAFKA_HUB.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE.DEAD_LETTER,
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
    KAFKA_HUB.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE.DEAD_LETTER,
  )
  async handleNotifyUpdateUserWithdrawSettingRequestIssueDeadLetterEvent(
    @Payload('value')
    message: HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest,
    @LoggerParam(NotifyUpdateUserWithdrawSettingRequestIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyUserWithdrawSettingRequestIssueDatabaseRepository)
    notifyIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandleNotifyUpdateUserWithdrawSettingRequestIssueEventRequest(
        message,
      );

    logger.debug('Handle failed update issue event.', { payload });

    const controller =
      new HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventController(
        logger,
        notifyIssueRepository,
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
