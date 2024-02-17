import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { InjectLogger } from '@zro/common';
import {
  IssueInfractionGateway,
  IssuePixFraudDetectionGateway,
  IssueRefundGateway,
} from '@zro/pix-payments/application';
import {
  JiraGatewayConfig,
  JiraPixInfractionGateway,
  JiraIssueRefundGateway,
  JiraPixFraudDetectionGateway,
} from '@zro/jira';

@Injectable()
export class JiraPixService {
  private readonly authUser: string;
  private readonly authToken: string;
  private readonly protocol: string;
  private readonly baseUrl: string;
  private readonly port: string;

  // Jira Infraction
  private jiraPixInfraction: JiraApi;

  private infractionProjectId: string;
  private infractionReporterId: string;
  private infractionIssueTypeId: string;

  // Jira Infraction custom fields
  private customFieldInfractionOperationId: string;
  private customFieldInfractionEndToEndId: string;
  private customFieldInfractionId: string;
  private customFieldInfractionDebitParticipant: string;
  private customFieldInfractionCreditParticipant: string;

  private customFieldInfractionReason: string;
  private customFieldInfractionReasonFraud: string;
  private customFieldInfractionReasonRequestRefund: string;
  private customFieldInfractionReasonCancelDevolution: string;

  private customFieldInfractionResolution: string;
  private customFieldInfractionResolutionAgree: string;
  private customFieldInfractionResolutionDisagree: string;

  private customFieldInfractionReporter: string;
  private customFieldInfractionReporterDebitedParticipant: string;
  private customFieldInfractionReporterCrebitedParticipant: string;

  private customFieldInfractionStatusNew: string;
  private customFieldInfractionStatusOpened: string;
  private customFieldInfractionStatusClosed: string;
  private customFieldInfractionStatusReceived: string;
  private customFieldInfractionStatusInAnalysis: string;
  private customFieldInfractionStatusAcknowleged: string;
  private customFieldInfractionStatusCancelled: string;

  // Jira Refund
  private jiraPixRefund: JiraApi;

  private refundProjectId: string;
  private refundIssueTypeId: string;
  private refundReporterId: string;

  // Jira refund custom fields
  private customRefundFieldEndToEndId: string;
  private customRefundFieldAmount: string;
  private customRefundFieldOperationId: string;

  private customRefundFieldRefundCancelledStatus: string;
  private customRefundFieldRefundClosedStatus: string;
  private customRefundFiedlRefundReceivedStatus: string;

  private customRefundFieldRefundRejectionReason: string;
  private customRefundFieldRefundRejectionAccountClosureReason: string;
  private customRefundFieldRefundRejectionCannotRefundReason: string;
  private customRefundFieldRefundRejectionNoBalanceReason: string;
  private customRefundFieldRefundRejectionOtherReason: string;

  private customRefundFieldRefundSolicitationPspId: string;
  private customRefundFieldRefundDevolutionEndToEndId: string;
  private customRefundFieldRefundAnalisysDetails: string;

  private customRefundFieldRefundReason: string;
  private customRefundFieldRefundFraudReason: string;
  private customRefundFieldRefundOperationFlawReason: string;
  private customRefundFieldRefundCancelledReason: string;

  // Jira Pix Fraud Detection
  private jiraPixFraudDetection: JiraApi;

  private pixFraudDetectionProjectId: string;
  private pixFraudDetectionReporterId: string;
  private pixFraudDetectionIssueTypeId: string;

  // Jira Pix Fraud Detection custom fields
  private customFieldPixFraudDetectionExternalId: string;
  private customFieldPixFraudDetectionDocument: string;
  private customFieldPixFraudDetectionFraudType: string;
  private customFieldPixFraudDetectionKey: string;
  private customFieldPixFraudDetectionFraudTypeFalseIdentification: string;
  private customFieldPixFraudDetectionFraudTypeDummyAccount: string;
  private customFieldPixFraudDetectionFraudTypeFraudsterAccount: string;
  private customFieldPixFraudDetectionFraudTypeOther: string;
  private customFieldPixFraudDetectionStatusCanceled: string;
  private customFieldPixFraudDetectionTransitionCancel: string;
  private customFieldPixFraudDetectionTransitionReceived: string;

  constructor(
    private readonly configService: ConfigService<JiraGatewayConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: JiraPixService.name });
    this.protocol =
      this.configService.get<string>('APP_JIRA_PROTOCOL') ?? 'http';
    this.baseUrl = this.configService.get<string>('APP_JIRA_BASE_URL');
    this.port = this.configService.get<string>('APP_JIRA_PORT');
    this.authUser = this.configService.get<string>('APP_JIRA_AUTH_USER');
    this.authToken = this.configService.get<string>('APP_JIRA_AUTH_TOKEN');

    this.configIssueInfraction();
    this.configIssueRefund();
    this.configIssuePixFraudDetection();
  }

  configIssueInfraction() {
    this.infractionProjectId = this.configService.get<string>(
      'APP_JIRA_INFRACTION_PROJECT_ID',
    );
    this.infractionReporterId = this.configService.get<string>(
      'APP_JIRA_INFRACTION_REPORTER_ID',
    );
    this.infractionIssueTypeId = this.configService.get<string>(
      'APP_JIRA_INFRACTION_ISSUE_TYPE_ID',
    );
    this.customFieldInfractionOperationId = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_OPERATION_ID',
    );
    this.customFieldInfractionEndToEndId = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_END_TO_END_ID',
    );
    this.customFieldInfractionId = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_INFRACTION_ID',
    );
    this.customFieldInfractionDebitParticipant = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_DEBITED_PARTICIPANT',
    );
    this.customFieldInfractionCreditParticipant =
      this.configService.get<string>(
        'APP_JIRA_INFRACTION_CUSTOM_FIELD_CREDIT_PARTICIPANT',
      );
    this.customFieldInfractionReason = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON',
    );
    this.customFieldInfractionReasonFraud = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_FRAUD',
    );
    this.customFieldInfractionReasonRequestRefund =
      this.configService.get<string>(
        'APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_REQUEST_REFUND',
      );
    this.customFieldInfractionReasonCancelDevolution =
      this.configService.get<string>(
        'APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_CANCEL_DEVOLUTION',
      );
    this.customFieldInfractionReporter = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_REPORTER',
    );
    this.customFieldInfractionReporterDebitedParticipant =
      this.configService.get<string>(
        'APP_JIRA_INFRACTION_CUSTOM_FIELD_REPORTER_DEBITED_PARTICIPANT',
      );
    this.customFieldInfractionReporterCrebitedParticipant =
      this.configService.get<string>(
        'APP_JIRA_INFRACTION_CUSTOM_FIELD_REPORTER_CREBITED_PARTICIPANT',
      );
    this.customFieldInfractionResolution = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION',
    );
    this.customFieldInfractionResolutionAgree = this.configService.get<string>(
      'APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_AGREE',
    );
    this.customFieldInfractionResolutionDisagree =
      this.configService.get<string>(
        'APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_DISAGREE',
      );
    this.customFieldInfractionStatusNew = this.configService.get<string>(
      'APP_JIRA_INFRACTION_TRANSITION_CREATE',
    );
    this.customFieldInfractionStatusOpened = this.configService.get<string>(
      'APP_JIRA_INFRACTION_TRANSITION_OPEN',
    );
    this.customFieldInfractionStatusClosed = this.configService.get<string>(
      'APP_JIRA_INFRACTION_TRANSITION_CLOSE',
    );
    this.customFieldInfractionStatusReceived = this.configService.get<string>(
      'APP_JIRA_INFRACTION_TRANSITION_RECEIVE',
    );
    this.customFieldInfractionStatusInAnalysis = this.configService.get<string>(
      'APP_JIRA_INFRACTION_TRANSITION_IN_ANALYSIS',
    );
    this.customFieldInfractionStatusAcknowleged =
      this.configService.get<string>(
        'APP_JIRA_INFRACTION_TRANSITION_ACK_RECEIVED',
      );
    this.customFieldInfractionStatusCancelled = this.configService.get<string>(
      'APP_JIRA_INFRACTION_TRANSITION_CANCEL',
    );

    this.jiraPixInfraction = new JiraApi({
      strictSSL: this.protocol === 'https',
      protocol: this.protocol,
      host: this.baseUrl,
      ...(this.port && { port: this.port }),
      username: this.authUser,
      password: this.authToken,
      apiVersion: '2',
    });
  }

  configIssueRefund() {
    this.refundProjectId = this.configService.get<string>(
      'APP_JIRA_REFUND_PROJECT_ID',
    );
    this.refundIssueTypeId = this.configService.get<string>(
      'APP_JIRA_REFUND_ISSUE_TYPE_ID',
    );
    this.refundReporterId = this.configService.get<string>(
      'APP_JIRA_REFUND_REPORTER_ID',
    );

    this.customRefundFieldEndToEndId = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_END_TO_END_ID',
    );
    this.customRefundFieldAmount = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_AMOUNT',
    );
    this.customRefundFieldOperationId = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_OPERATION_ID',
    );

    this.customRefundFieldRefundCancelledStatus =
      this.configService.get<string>('APP_JIRA_REFUND_TRANSITION_CANCELLED');
    this.customRefundFieldRefundClosedStatus = this.configService.get<string>(
      'APP_JIRA_REFUND_TRANSITION_CLOSED',
    );
    this.customRefundFiedlRefundReceivedStatus = this.configService.get<string>(
      'APP_JIRA_REFUND_TRANSITION_RECEIVED',
    );

    this.customRefundFieldRefundRejectionReason =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_REASON',
      );
    this.customRefundFieldRefundRejectionAccountClosureReason =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_ACCOUNT_CLOSURE_REASON',
      );
    this.customRefundFieldRefundRejectionCannotRefundReason =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_CANNOT_REFUND_REASON',
      );
    this.customRefundFieldRefundRejectionNoBalanceReason =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_NO_BALANCE_REASON',
      );
    this.customRefundFieldRefundRejectionOtherReason =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_OTHER_REASON',
      );

    this.customRefundFieldRefundSolicitationPspId =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_SOLICITATION_PSP_ID',
      );

    this.customRefundFieldRefundDevolutionEndToEndId =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_DEVOLUTION_END_TO_END_ID',
      );

    this.customRefundFieldRefundAnalisysDetails =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_ANALISYS_DETAILS',
      );

    this.customRefundFieldRefundReason = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_REASON',
    );

    this.customRefundFieldRefundFraudReason = this.configService.get<string>(
      'APP_JIRA_REFUND_CUSTOM_FIELD_FRAUD_REASON',
    );

    this.customRefundFieldRefundOperationFlawReason =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_OPERATION_FLAW_REASON',
      );

    this.customRefundFieldRefundCancelledReason =
      this.configService.get<string>(
        'APP_JIRA_REFUND_CUSTOM_FIELD_CANCELLED_REASON',
      );

    this.jiraPixRefund = new JiraApi({
      strictSSL: this.protocol === 'https',
      protocol: this.protocol,
      host: this.baseUrl,
      ...(this.port && { port: this.port }),
      username: this.authUser,
      password: this.authToken,
      apiVersion: '2',
    });
  }

  configIssuePixFraudDetection() {
    this.pixFraudDetectionProjectId = this.configService.get<string>(
      'APP_JIRA_PIX_FRAUD_DETECTION_PROJECT_ID',
    );
    this.pixFraudDetectionReporterId = this.configService.get<string>(
      'APP_JIRA_PIX_FRAUD_DETECTION_REPORTER_ID',
    );
    this.pixFraudDetectionIssueTypeId = this.configService.get<string>(
      'APP_JIRA_PIX_FRAUD_DETECTION_ISSUE_TYPE_ID',
    );
    this.customFieldPixFraudDetectionExternalId =
      this.configService.get<string>(
        'APP_JIRA_PIX_FRAUD_DETECTION_EXTERNAL_ID',
      );
    this.customFieldPixFraudDetectionDocument = this.configService.get<string>(
      'APP_JIRA_PIX_FRAUD_DETECTION_DOCUMENT',
    );
    this.customFieldPixFraudDetectionFraudType = this.configService.get<string>(
      'APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE',
    );
    this.customFieldPixFraudDetectionKey = this.configService.get<string>(
      'APP_JIRA_PIX_FRAUD_DETECTION_KEY',
    );

    this.customFieldPixFraudDetectionStatusCanceled =
      this.configService.get<string>(
        'APP_JIRA_PIX_FRAUD_DETECTION_STATUS_CANCELED',
      );

    this.customFieldPixFraudDetectionFraudTypeFalseIdentification =
      this.configService.get<string>(
        'APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE_FALSE_IDENTIFICATION',
      );
    this.customFieldPixFraudDetectionFraudTypeDummyAccount =
      this.configService.get<string>(
        'APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE_DUMMY_ACCOUNT',
      );
    this.customFieldPixFraudDetectionFraudTypeFraudsterAccount =
      this.configService.get<string>(
        'APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE_FRAUDSTER_ACCOUNT',
      );
    this.customFieldPixFraudDetectionFraudTypeOther =
      this.configService.get<string>(
        'APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE_OTHER',
      );

    this.customFieldPixFraudDetectionTransitionCancel =
      this.configService.get<string>(
        'APP_JIRA_PIX_FRAUD_DETECTION_TRANSITION_CANCEL_RECEIVED',
      );

    this.customFieldPixFraudDetectionTransitionReceived =
      this.configService.get<string>(
        'APP_JIRA_PIX_FRAUD_DETECTION_TRANSITION_RECEIVED',
      );

    this.jiraPixFraudDetection = new JiraApi({
      strictSSL: this.protocol === 'https',
      protocol: this.protocol,
      host: this.baseUrl,
      ...(this.port && { port: this.port }),
      username: this.authUser,
      password: this.authToken,
      apiVersion: '2',
    });
  }

  getPixInfractionGateway(logger?: Logger): IssueInfractionGateway {
    return new JiraPixInfractionGateway(
      logger ?? this.logger,
      this.jiraPixInfraction,
      this.infractionProjectId,
      this.infractionReporterId,
      this.infractionIssueTypeId,
      this.customFieldInfractionOperationId,
      this.customFieldInfractionEndToEndId,
      this.customFieldInfractionId,
      this.customFieldInfractionDebitParticipant,
      this.customFieldInfractionCreditParticipant,
      this.customFieldInfractionReason,
      this.customFieldInfractionReasonFraud,
      this.customFieldInfractionReasonRequestRefund,
      this.customFieldInfractionReasonCancelDevolution,
      this.customFieldInfractionResolution,
      this.customFieldInfractionResolutionAgree,
      this.customFieldInfractionResolutionDisagree,
      this.customFieldInfractionReporter,
      this.customFieldInfractionReporterDebitedParticipant,
      this.customFieldInfractionReporterCrebitedParticipant,
      this.customFieldInfractionStatusNew,
      this.customFieldInfractionStatusOpened,
      this.customFieldInfractionStatusClosed,
      this.customFieldInfractionStatusReceived,
      this.customFieldInfractionStatusInAnalysis,
      this.customFieldInfractionStatusAcknowleged,
      this.customFieldInfractionStatusCancelled,
    );
  }

  getIssueRefundGateway(logger?: Logger): IssueRefundGateway {
    return new JiraIssueRefundGateway(
      logger ?? this.logger,
      this.jiraPixRefund,
      this.refundProjectId,
      this.refundIssueTypeId,
      this.refundReporterId,

      this.customRefundFieldEndToEndId,
      this.customRefundFieldAmount,
      this.customRefundFieldOperationId,

      this.customRefundFieldRefundCancelledStatus,
      this.customRefundFieldRefundClosedStatus,
      this.customRefundFiedlRefundReceivedStatus,

      this.customRefundFieldRefundRejectionReason,
      this.customRefundFieldRefundRejectionAccountClosureReason,
      this.customRefundFieldRefundRejectionCannotRefundReason,
      this.customRefundFieldRefundRejectionNoBalanceReason,
      this.customRefundFieldRefundRejectionOtherReason,

      this.customRefundFieldRefundSolicitationPspId,
      this.customRefundFieldRefundDevolutionEndToEndId,
      this.customRefundFieldRefundAnalisysDetails,

      this.customRefundFieldRefundReason,
      this.customRefundFieldRefundFraudReason,
      this.customRefundFieldRefundOperationFlawReason,
      this.customRefundFieldRefundCancelledReason,
    );
  }

  getPixFraudDetectionGateway(logger?: Logger): IssuePixFraudDetectionGateway {
    return new JiraPixFraudDetectionGateway(
      logger ?? this.logger,
      this.jiraPixFraudDetection,
      this.pixFraudDetectionProjectId,
      this.pixFraudDetectionIssueTypeId,
      this.customFieldPixFraudDetectionExternalId,
      this.customFieldPixFraudDetectionDocument,
      this.customFieldPixFraudDetectionFraudType,
      this.customFieldPixFraudDetectionKey,
      this.customFieldPixFraudDetectionFraudTypeFalseIdentification,
      this.customFieldPixFraudDetectionFraudTypeDummyAccount,
      this.customFieldPixFraudDetectionFraudTypeFraudsterAccount,
      this.customFieldPixFraudDetectionFraudTypeOther,
      this.customFieldPixFraudDetectionStatusCanceled,
      this.customFieldPixFraudDetectionTransitionCancel,
      this.customFieldPixFraudDetectionTransitionReceived,
    );
  }
}
