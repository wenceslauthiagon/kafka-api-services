import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { KafkaService, InjectLogger } from '@zro/common';
import {
  NotifyPixFraudDetectionIssue,
  NotifyPixInfractionIssue,
  NotifyPixRefundIssue,
  NotifyUserLimitRequestIssue,
  NotifyUserWithdrawSettingRequestIssue,
  NotifyWarningTransactionIssue,
} from '@zro/api-jira/domain';
import {
  KAFKA_EVENTS,
  HandleNotifyCreatePixInfractionIssueEventKafkaRequest,
  HandleNotifyUpdatePixInfractionIssueEventKafkaRequest,
  HandleNotifyUpdateUserLimitRequestIssueEventKafkaRequest,
  HandleNotifyUpdateWarningTransactionIssueEventKafkaRequest,
  HandleNotifyUpdatePixRefundIssueEventKafkaRequest,
  HandleNotifyUpdateUserWithdrawSettingRequestIssueEventKafkaRequest,
  HandleNotifyUpdatePixFraudDetectionIssueEventKafkaRequest,
} from '@zro/api-jira/infrastructure';

/**
 * Send to own api-jira microservice.
 */
@Injectable()
export class JiraServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: JiraServiceKafka.name });
    this.kafkaService.subscribe([
      KAFKA_EVENTS.ISSUE.INFRACTION.NOTIFY_CREATE,
      KAFKA_EVENTS.ISSUE.INFRACTION.NOTIFY_UPDATE,
      KAFKA_EVENTS.ISSUE.USER_LIMIT_REQUEST.NOTIFY_UPDATE,
      KAFKA_EVENTS.ISSUE.REFUND.NOTIFY_UPDATE,
      KAFKA_EVENTS.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE,
      KAFKA_EVENTS.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE,
      KAFKA_EVENTS.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE,
    ]);
  }

  /**
   * Call own api-jira microservice to notify a new completion.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyCreatePixInfractionIssue(
    requestId: string,
    payload: NotifyPixInfractionIssue,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyCreatePixInfractionIssueEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiJira microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyCreatePixInfractionIssueEventKafkaRequest>(
        KAFKA_EVENTS.ISSUE.INFRACTION.NOTIFY_CREATE,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-jira microservice to notify a update completion.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyUpdatePixInfractionIssue(
    requestId: string,
    payload: NotifyPixInfractionIssue,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyUpdatePixInfractionIssueEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiJira microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyUpdatePixInfractionIssueEventKafkaRequest>(
        KAFKA_EVENTS.ISSUE.INFRACTION.NOTIFY_UPDATE,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-jira microservice to notify a update.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyUpdatePixRefundIssue(
    requestId: string,
    payload: NotifyPixRefundIssue,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyUpdatePixRefundIssueEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiJira microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyUpdatePixRefundIssueEventKafkaRequest>(
        KAFKA_EVENTS.ISSUE.REFUND.NOTIFY_UPDATE,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-jira microservice to notify a update user limit request issue.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyUpdateUserLimitRequestIssue(
    requestId: string,
    payload: NotifyUserLimitRequestIssue,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyUpdateUserLimitRequestIssueEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiJira microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyUpdateUserLimitRequestIssueEventKafkaRequest>(
        KAFKA_EVENTS.ISSUE.USER_LIMIT_REQUEST.NOTIFY_UPDATE,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-jira microservice to notify a update warning transaction issue.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyUpdateWarningTransactionIssue(
    requestId: string,
    payload: NotifyWarningTransactionIssue,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyUpdateWarningTransactionIssueEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiJira microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyUpdateWarningTransactionIssueEventKafkaRequest>(
        KAFKA_EVENTS.ISSUE.WARNING_TRANSACTION.NOTIFY_UPDATE,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-jira microservice to notify a user withdraw setting request issue.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyUpdateUserWithdrawSettingRequestIssue(
    requestId: string,
    payload: NotifyUserWithdrawSettingRequestIssue,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyUpdateUserWithdrawSettingRequestIssueEventKafkaRequest =
      {
        key: `${requestId}`,
        headers: { requestId },
        value: { ...payload },
      };

    logger.debug('Send notify message.', { data });

    // Call ApiJira microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyUpdateUserWithdrawSettingRequestIssueEventKafkaRequest>(
        KAFKA_EVENTS.ISSUE.USER_WITHDRAW_SETTING_REQUEST.NOTIFY_UPDATE,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }

  /**
   * Call own api-jira microservice to notify a fraud detection request issue.
   * @param requestId Unique shared request ID.
   * @param payload The completion data.
   */
  async notifyUpdatePixFraudDetectionIssue(
    requestId: string,
    payload: NotifyPixFraudDetectionIssue,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: HandleNotifyUpdatePixFraudDetectionIssueEventKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: { ...payload },
    };

    logger.debug('Send notify message.', { data });

    // Call ApiJira microservice.
    const result =
      await this.kafkaService.emit<HandleNotifyUpdatePixFraudDetectionIssueEventKafkaRequest>(
        KAFKA_EVENTS.ISSUE.FRAUD_DETECTION.NOTIFY_UPDATE,
        data,
      );

    logger.debug('Notify message sent.', { result });
  }
}
