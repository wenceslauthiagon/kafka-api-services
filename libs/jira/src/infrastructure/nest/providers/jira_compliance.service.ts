import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { InjectLogger } from '@zro/common';
import {
  JiraGatewayConfig,
  JiraWarningTransactionGateway,
  JiraIssueUserLimitRequestGateway,
  JiraUserWithdrawSettingRequestGateway,
} from '@zro/jira';
import {
  WarningTransactionGateway,
  UserLimitRequestGateway,
  UserWithdrawSettingRequestGateway,
} from '@zro/compliance/application';
import { IssueWarningTransactionGateway } from '@zro/pix-payments/application';

@Injectable()
export class JiraComplianceService {
  private readonly authUser: string;
  private readonly authToken: string;
  private readonly protocol: string;
  private readonly baseUrl: string;
  private readonly port: string;

  // Jira Warning Transaction
  private jiraWarningTransaction: JiraApi;

  private warningTransactionProjectId: string;
  private warningTransactionReporterId: string;
  private warningTransactionIssueTypeId: string;

  // Jira Warning Transaction Custom Fields
  private customFieldWarningTransactionOperationId: string;
  private customFieldWarningTransactionTransactionTag: string;
  private customFieldWarningTransactionEndToEndId: string;
  private customFieldWarningTransactionReason: string;
  private customFieldWarningTransactionStatusNew: string;
  private customFieldWarningTransactionStatusClosed: string;
  private customFieldWarningTransactionStatusInAnalysis: string;
  private customFieldWarningTransactionTransitionClose: string;
  private customFieldWarningTransactionTransitionInAnalysis: string;

  // Jira User
  private jiraUser: JiraApi;

  private userLimitRequestReporterId: string;
  private userLimitRequestProjectId: string;
  private userLimitRequestIssueTypeId: string;

  // Jira User custom fields
  private customFieldUserLimitRequestId: string;
  private customFieldUserLimitRequestUserId: string;
  private customFieldUserLimitRequestUserLimitId: string;
  private customFieldUserLimitRequestYearlyLimit: string;
  private customFieldUserLimitRequestMonthlyLimit: string;
  private customFieldUserLimitRequestDailyLimit: string;
  private customFieldUserLimitRequestNightlyLimit: string;
  private customFieldUserLimitRequestMaxAmount: string;
  private customFieldUserLimitRequestMinAmount: string;
  private customFieldUserLimitRequestMaxAmountNightly: string;
  private customFieldUserLimitRequestMinAmountNightly: string;

  // Jira User withdraw setting request
  private jiraUserWithdrawSettingRequest: JiraApi;

  private userWithdrawSettingRequestProjectId: string;
  private userWithdrawSettingRequestIssueTypeId: string;

  private customFieldUserWithdrawSettingRequestId: string;
  private customFieldUserWithdrawSettingRequestUserId: string;
  private customFieldUserWithdrawSettingRequestWalletId: string;
  private customFieldUserWithdrawSettingRequestTransactionTypeId: string;
  private customFieldUserWithdrawSettingRequestPixKey: string;
  private customFieldUserWithdrawSettingRequestPixKeyType: string;
  private customFieldUserWithdrawSettingRequestType: string;
  private customFieldUserWithdrawSettingRequestBalanceType: string;
  private customFieldUserWithdrawSettingRequestDailyType: string;
  private customFieldUserWithdrawSettingRequestMonthlyType: string;
  private customFieldUserWithdrawSettingRequestWeeklyType: string;
  private customFieldUserWithdrawSettingRequestBalance: string;
  private customFieldUserWithdrawSettingRequestDay: string;
  private customFieldUserWithdrawSettingRequestWeekDay: string;
  private customFieldUserWithdrawSettingRequestMondayWeekDay: string;
  private customFieldUserWithdrawSettingRequestTuesdayWeekDay: string;
  private customFieldUserWithdrawSettingRequestWednesdayWeekDay: string;
  private customFieldUserWithdrawSettingRequestThursdayWeekDay: string;
  private customFieldUserWithdrawSettingRequestFridayWeekDay: string;
  private customFieldUserWithdrawSettingRequestSaturdayWeekDay: string;
  private customFieldUserWithdrawSettingRequestSundayWeekDay: string;

  constructor(
    private readonly configService: ConfigService<JiraGatewayConfig>,
    @InjectLogger() private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: JiraComplianceService.name });
    this.protocol =
      this.configService.get<string>('APP_JIRA_PROTOCOL') ?? 'http';
    this.baseUrl = this.configService.get<string>('APP_JIRA_BASE_URL');
    this.port = this.configService.get<string>('APP_JIRA_PORT');
    this.authUser = this.configService.get<string>('APP_JIRA_AUTH_USER');
    this.authToken = this.configService.get<string>('APP_JIRA_AUTH_TOKEN');
    this.configIssueWarningTransaction();
    this.configIssueUserLimitRequest();
    this.configUserWithdrawSettingRequest();
  }

  configIssueWarningTransaction() {
    this.warningTransactionProjectId = this.configService.get<string>(
      'APP_JIRA_WARNING_TRANSACTION_PROJECT_ID',
    );
    this.warningTransactionReporterId = this.configService.get<string>(
      'APP_JIRA_WARNING_TRANSACTION_REPORTER_ID',
    );
    this.warningTransactionIssueTypeId = this.configService.get<string>(
      'APP_JIRA_WARNING_TRANSACTION_ISSUE_TYPE_ID',
    );

    this.customFieldWarningTransactionOperationId =
      this.configService.get<string>(
        'APP_JIRA_CUSTOM_FIELD_WARNING_TRANSACTION_OPERATION_ID',
      );

    this.customFieldWarningTransactionTransactionTag =
      this.configService.get<string>(
        'APP_JIRA_CUSTOM_FIELD_WARNING_TRANSACTION_TRANSACTION_TAG',
      );

    this.customFieldWarningTransactionEndToEndId =
      this.configService.get<string>(
        'APP_JIRA_CUSTOM_FIELD_WARNING_TRANSACTION_END_TO_END_ID',
      );

    this.customFieldWarningTransactionReason = this.configService.get<string>(
      'APP_JIRA_CUSTOM_FIELD_WARNING_TRANSACTION_REASON',
    );

    this.customFieldWarningTransactionStatusNew =
      this.configService.get<string>('APP_JIRA_WARNING_TRANSACTION_STATUS_NEW');

    this.customFieldWarningTransactionStatusClosed =
      this.configService.get<string>(
        'APP_JIRA_WARNING_TRANSACTION_STATUS_CLOSED',
      );

    this.customFieldWarningTransactionStatusInAnalysis =
      this.configService.get<string>(
        'APP_JIRA_WARNING_TRANSACTION_STATUS_IN_ANALYSIS',
      );

    this.customFieldWarningTransactionTransitionClose =
      this.configService.get<string>(
        'APP_JIRA_WARNING_TRANSACTION_TRANSITION_CLOSE',
      );

    this.customFieldWarningTransactionTransitionInAnalysis =
      this.configService.get<string>(
        'APP_JIRA_WARNING_TRANSACTION_TRANSITION_IN_ANALYSIS',
      );

    this.jiraWarningTransaction = new JiraApi({
      strictSSL: this.protocol === 'https',
      protocol: this.protocol,
      host: this.baseUrl,
      ...(this.port && { port: this.port }),
      username: this.authUser,
      password: this.authToken,
      apiVersion: '2',
    });
  }

  configIssueUserLimitRequest() {
    this.userLimitRequestProjectId = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_PROJECT_ID',
    );
    this.userLimitRequestReporterId = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_REPORTER_ID',
    );
    this.userLimitRequestIssueTypeId = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_ISSUE_TYPE_ID',
    );

    this.customFieldUserLimitRequestId = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_ID',
    );
    this.customFieldUserLimitRequestUserId = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_USER_ID',
    );
    this.customFieldUserLimitRequestUserLimitId =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_USER_LIMIT_ID',
      );
    this.customFieldUserLimitRequestYearlyLimit =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_YEARLY_LIMIT',
      );
    this.customFieldUserLimitRequestMonthlyLimit =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MONTHLY_LIMIT',
      );
    this.customFieldUserLimitRequestDailyLimit = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_DAILY_LIMIT',
    );
    this.customFieldUserLimitRequestNightlyLimit =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_NIGHTLY_LIMIT',
      );
    this.customFieldUserLimitRequestMaxAmount = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MAX_AMOUNT',
    );
    this.customFieldUserLimitRequestMinAmount = this.configService.get<string>(
      'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MIN_AMOUNT',
    );
    this.customFieldUserLimitRequestMaxAmountNightly =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MAX_AMOUNT_NIGHTLY',
      );
    this.customFieldUserLimitRequestMinAmountNightly =
      this.configService.get<string>(
        'APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MIN_AMOUNT_NIGHTLY',
      );

    this.jiraUser = new JiraApi({
      strictSSL: this.protocol === 'https',
      protocol: this.protocol,
      host: this.baseUrl,
      ...(this.port && { port: this.port }),
      username: this.authUser,
      password: this.authToken,
      apiVersion: '2',
    });
  }

  configUserWithdrawSettingRequest() {
    this.userWithdrawSettingRequestProjectId = this.configService.get<string>(
      'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_PROJECT_ID',
    );
    this.userWithdrawSettingRequestIssueTypeId = this.configService.get<string>(
      'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_ISSUE_TYPE_ID',
    );

    this.customFieldUserWithdrawSettingRequestId =
      this.configService.get<string>(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_ID',
      );
    this.customFieldUserWithdrawSettingRequestUserId =
      this.configService.get<string>(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_USER_ID',
      );
    this.customFieldUserWithdrawSettingRequestWalletId = this.configService.get(
      'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_WALLET_ID',
    );
    this.customFieldUserWithdrawSettingRequestTransactionTypeId =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_TRANSACTION_TYPE_ID',
      );
    this.customFieldUserWithdrawSettingRequestPixKey = this.configService.get(
      'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_PIX_KEY',
    );
    this.customFieldUserWithdrawSettingRequestPixKeyType =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_PIX_KEY_TYPE',
      );
    this.customFieldUserWithdrawSettingRequestType = this.configService.get(
      'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_TYPE',
    );
    this.customFieldUserWithdrawSettingRequestBalanceType =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_BALANCE_TYPE',
      );
    this.customFieldUserWithdrawSettingRequestDailyType =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_DAILY_TYPE',
      );
    this.customFieldUserWithdrawSettingRequestMonthlyType =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_MONTHLY_TYPE',
      );
    this.customFieldUserWithdrawSettingRequestWeeklyType =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_WEEKLY_TYPE',
      );
    this.customFieldUserWithdrawSettingRequestBalance = this.configService.get(
      'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_BALANCE',
    );
    this.customFieldUserWithdrawSettingRequestDay = this.configService.get(
      'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_DAY',
    );
    this.customFieldUserWithdrawSettingRequestWeekDay = this.configService.get(
      'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_WEEK_DAY',
    );
    this.customFieldUserWithdrawSettingRequestMondayWeekDay =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_MONDAY_WEEK_DAY',
      );
    this.customFieldUserWithdrawSettingRequestTuesdayWeekDay =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_TUESDAY_WEEK_DAY',
      );
    this.customFieldUserWithdrawSettingRequestWednesdayWeekDay =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_WEDNESDAY_WEEK_DAY',
      );
    this.customFieldUserWithdrawSettingRequestThursdayWeekDay =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_THURSDAY_WEEK_DAY',
      );
    this.customFieldUserWithdrawSettingRequestFridayWeekDay =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_FRIDAY_WEEK_DAY',
      );
    this.customFieldUserWithdrawSettingRequestSaturdayWeekDay =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_SATURDAY_WEEK_DAY',
      );
    this.customFieldUserWithdrawSettingRequestSundayWeekDay =
      this.configService.get(
        'APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_SUNDAY_WEEK_DAY',
      );

    this.jiraUserWithdrawSettingRequest = new JiraApi({
      strictSSL: this.protocol === 'https',
      protocol: this.protocol,
      host: this.baseUrl,
      ...(this.port && { port: this.port }),
      username: this.authUser,
      password: this.authToken,
      apiVersion: '2',
    });
  }

  getWarningTransactionGateway(
    logger?: Logger,
  ): WarningTransactionGateway & IssueWarningTransactionGateway {
    return new JiraWarningTransactionGateway(
      logger ?? this.logger,
      this.jiraWarningTransaction,
      this.warningTransactionProjectId,
      this.warningTransactionReporterId,
      this.warningTransactionIssueTypeId,
      this.customFieldWarningTransactionOperationId,
      this.customFieldWarningTransactionTransactionTag,
      this.customFieldWarningTransactionEndToEndId,
      this.customFieldWarningTransactionReason,
      this.customFieldWarningTransactionStatusNew,
      this.customFieldWarningTransactionStatusClosed,
      this.customFieldWarningTransactionStatusInAnalysis,
      this.customFieldWarningTransactionTransitionClose,
      this.customFieldWarningTransactionTransitionInAnalysis,
    );
  }

  getIssueUserLimitRequestGateway(logger?: Logger): UserLimitRequestGateway {
    return new JiraIssueUserLimitRequestGateway(
      logger ?? this.logger,
      this.jiraUser,
      this.userLimitRequestReporterId,
      this.userLimitRequestProjectId,
      this.userLimitRequestIssueTypeId,
      this.customFieldUserLimitRequestId,
      this.customFieldUserLimitRequestUserId,
      this.customFieldUserLimitRequestUserLimitId,
      this.customFieldUserLimitRequestYearlyLimit,
      this.customFieldUserLimitRequestMonthlyLimit,
      this.customFieldUserLimitRequestDailyLimit,
      this.customFieldUserLimitRequestNightlyLimit,
      this.customFieldUserLimitRequestMaxAmount,
      this.customFieldUserLimitRequestMinAmount,
      this.customFieldUserLimitRequestMaxAmountNightly,
      this.customFieldUserLimitRequestMinAmountNightly,
    );
  }

  getUserWithdrawSettingRequestGateway(
    logger?: Logger,
  ): UserWithdrawSettingRequestGateway {
    return new JiraUserWithdrawSettingRequestGateway(
      logger ?? this.logger,
      this.jiraUserWithdrawSettingRequest,
      this.userWithdrawSettingRequestProjectId,
      this.userWithdrawSettingRequestIssueTypeId,
      this.customFieldUserWithdrawSettingRequestId,
      this.customFieldUserWithdrawSettingRequestUserId,
      this.customFieldUserWithdrawSettingRequestWalletId,
      this.customFieldUserWithdrawSettingRequestTransactionTypeId,
      this.customFieldUserWithdrawSettingRequestPixKey,
      this.customFieldUserWithdrawSettingRequestPixKeyType,
      this.customFieldUserWithdrawSettingRequestType,
      this.customFieldUserWithdrawSettingRequestBalanceType,
      this.customFieldUserWithdrawSettingRequestDailyType,
      this.customFieldUserWithdrawSettingRequestMonthlyType,
      this.customFieldUserWithdrawSettingRequestWeeklyType,
      this.customFieldUserWithdrawSettingRequestBalance,
      this.customFieldUserWithdrawSettingRequestDay,
      this.customFieldUserWithdrawSettingRequestWeekDay,
      this.customFieldUserWithdrawSettingRequestMondayWeekDay,
      this.customFieldUserWithdrawSettingRequestTuesdayWeekDay,
      this.customFieldUserWithdrawSettingRequestWednesdayWeekDay,
      this.customFieldUserWithdrawSettingRequestThursdayWeekDay,
      this.customFieldUserWithdrawSettingRequestFridayWeekDay,
      this.customFieldUserWithdrawSettingRequestSaturdayWeekDay,
      this.customFieldUserWithdrawSettingRequestSundayWeekDay,
    );
  }
}
