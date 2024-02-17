import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  KafkaModule,
  LoggerModule,
  DatabaseModule,
  ValidationModule,
} from '@zro/common';
import {
  NotifyCreatePixInfractionIssueRestController,
  NotifyUpdatePixInfractionIssueRestController,
  NotifyCreatePixInfractionIssueNestObserver,
  NotifyUpdatePixInfractionIssueNestObserver,
  JiraServiceKafka,
  NotifyPixInfractionIssueModel,
  NotifyUpdateUserLimitRequestIssueNestObserver,
  NotifyUpdateUserLimitRequestIssueRestController,
  NotifyUserLimitRequestIssueModel,
  NotifyPixRefundIssueModel,
  NotifyUpdatePixRefundIssueRestController,
  NotifyUpdatePixRefundIssueNestObserver,
  NotifyWarningTransactionIssueModel,
  NotifyUpdateWarningTransactionIssueRestController,
  NotifyUpdateWarningTransactionIssueNestObserver,
  NotifyUserWithdrawSettingRequestIssueModel,
  NotifyUpdateUserWithdrawSettingRequestIssueRestController,
  NotifyUpdateUserWithdrawSettingRequestIssueNestObserver,
  NotifyPixFraudDetectionIssueModel,
  NotifyUpdatePixFraudDetectionIssueRestController,
  NotifyUpdatePixFraudDetectionIssueNestObserver,
} from '@zro/api-jira/infrastructure';
import {
  CloseUserLimitRequestServiceKafka,
  CloseUserWithdrawSettingRequestServiceKafka,
  CloseWarningTransactionServiceKafka,
} from '@zro/compliance/infrastructure';
import {
  CancelPixFraudDetectionRegisteredServiceKafka,
  CancelPixInfractionServiceKafka,
  CancelPixRefundServiceKafka,
  ClosePixInfractionServiceKafka,
  ClosePixRefundServiceKafka,
  CreatePixInfractionServiceKafka,
  InAnalysisPixInfractionServiceKafka,
  OpenPixInfractionServiceKafka,
  RegisterPixFraudDetectionServiceKafka,
} from '@zro/pix-payments/infrastructure';

/**
 * Notify endpoints module.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule.forFeature([
      CloseUserLimitRequestServiceKafka,
      CloseUserWithdrawSettingRequestServiceKafka,
      CloseWarningTransactionServiceKafka,
      OpenPixInfractionServiceKafka,
      InAnalysisPixInfractionServiceKafka,
      ClosePixInfractionServiceKafka,
      CreatePixInfractionServiceKafka,
      CancelPixInfractionServiceKafka,
      ClosePixRefundServiceKafka,
      CancelPixRefundServiceKafka,
      RegisterPixFraudDetectionServiceKafka,
      CancelPixFraudDetectionRegisteredServiceKafka,
    ]),
    LoggerModule,
    DatabaseModule.forFeature([
      NotifyPixInfractionIssueModel,
      NotifyUserLimitRequestIssueModel,
      NotifyPixRefundIssueModel,
      NotifyWarningTransactionIssueModel,
      NotifyUserWithdrawSettingRequestIssueModel,
      NotifyPixFraudDetectionIssueModel,
    ]),
    ValidationModule,
  ],
  controllers: [
    NotifyCreatePixInfractionIssueRestController,
    NotifyUpdatePixInfractionIssueRestController,
    NotifyCreatePixInfractionIssueNestObserver,
    NotifyUpdatePixInfractionIssueNestObserver,
    NotifyUpdateUserLimitRequestIssueRestController,
    NotifyUpdateUserLimitRequestIssueNestObserver,
    NotifyUpdatePixRefundIssueRestController,
    NotifyUpdateUserWithdrawSettingRequestIssueRestController,
    NotifyUpdatePixRefundIssueNestObserver,
    NotifyUpdateWarningTransactionIssueRestController,
    NotifyUpdateWarningTransactionIssueNestObserver,
    NotifyUpdateUserWithdrawSettingRequestIssueNestObserver,
    NotifyUpdatePixFraudDetectionIssueRestController,
    NotifyUpdatePixFraudDetectionIssueNestObserver,
  ],
  providers: [JiraServiceKafka],
})
export class ApiJiraModule {}
