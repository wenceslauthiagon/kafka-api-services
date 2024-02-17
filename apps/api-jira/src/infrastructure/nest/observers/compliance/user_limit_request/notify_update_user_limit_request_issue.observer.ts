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
import { NotifyUserLimitRequestIssueRepository } from '@zro/api-jira/domain';
import { ComplianceService } from '@zro/api-jira/application';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyUserLimitRequestIssueEventKafkaEmitter,
  NotifyUserLimitRequestIssueDatabaseRepository,
  ComplianceServiceKafka,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyUpdateUserLimitRequestIssueEventController,
  HandleFailedNotifyUpdateUserLimitRequestIssueEventController,
  HandleNotifyUpdateUserLimitRequestIssueEventRequest,
  NotifyUserLimitRequestIssueEventEmitterControllerInterface,
} from '@zro/api-jira/interface';

export type HandleNotifyUpdateUserLimitRequestIssueEventKafkaRequest =
  KafkaMessage<HandleNotifyUpdateUserLimitRequestIssueEventRequest>;

/**
 * Notify Update User limit Request Issue observer.
 */
@Controller()
@ObserverController()
export class NotifyUpdateUserLimitRequestIssueNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.ISSUE.USER_LIMIT_REQUEST.NOTIFY_UPDATE.PAYMENT_GATEWAY,
      KAFKA_HUB.ISSUE.USER_LIMIT_REQUEST.NOTIFY_UPDATE.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify update.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.ISSUE.USER_LIMIT_REQUEST.NOTIFY_UPDATE)
  async handleNotifyUpdateUserLimitRequestIssueEvent(
    @Payload('value')
    message: HandleNotifyUpdateUserLimitRequestIssueEventRequest,
    @LoggerParam(NotifyUpdateUserLimitRequestIssueNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify update user limit request issue event.', {
      value: message,
    });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.ISSUE.USER_LIMIT_REQUEST.NOTIFY_UPDATE.PAYMENT_GATEWAY,
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
    KAFKA_HUB.ISSUE.USER_LIMIT_REQUEST.NOTIFY_UPDATE.PAYMENT_GATEWAY,
  )
  async handleNotifyUpdateUserLimitRequestIssueEventViaPixPayment(
    @Payload('value')
    message: HandleNotifyUpdateUserLimitRequestIssueEventRequest,
    @LoggerParam(NotifyUpdateUserLimitRequestIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyUserLimitRequestIssueDatabaseRepository)
    notifyIssueRepository: NotifyUserLimitRequestIssueRepository,
    @KafkaServiceParam(ComplianceServiceKafka)
    complianceService: ComplianceService,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdateUserLimitRequestIssueEventRequest(
      message,
    );

    logger.debug('Handle notify update issue event.', { payload });

    const controller =
      new HandleNotifyUpdateUserLimitRequestIssueEventController(
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
        KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_UPDATE.DEAD_LETTER,
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
    KAFKA_HUB.ISSUE.USER_LIMIT_REQUEST.NOTIFY_UPDATE.DEAD_LETTER,
  )
  async handleNotifyUpdateUserLimitRequestIssueDeadLetterEvent(
    @Payload('value')
    message: HandleNotifyUpdateUserLimitRequestIssueEventRequest,
    @LoggerParam(NotifyUpdateUserLimitRequestIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyUserLimitRequestIssueDatabaseRepository)
    notifyIssueRepository: NotifyUserLimitRequestIssueRepository,
    @EventEmitterParam(NotifyUserLimitRequestIssueEventKafkaEmitter)
    eventEmitter: NotifyUserLimitRequestIssueEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdateUserLimitRequestIssueEventRequest(
      message,
    );

    logger.debug('Handle failed update issue event.', { payload });

    const controller =
      new HandleFailedNotifyUpdateUserLimitRequestIssueEventController(
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
