export interface JiraGatewayConfig {
  APP_ENV: string;
  APP_JIRA_PROTOCOL: string;
  APP_JIRA_BASE_URL: string;
  APP_JIRA_PORT: string;
  APP_JIRA_AUTH_USER: string;
  APP_JIRA_AUTH_TOKEN: string;

  // Jira Infraction Fields
  APP_JIRA_INFRACTION_PROJECT_ID: string;
  APP_JIRA_INFRACTION_REPORTER_ID: string;
  APP_JIRA_INFRACTION_ISSUE_TYPE_ID: string;

  APP_JIRA_INFRACTION_CUSTOM_FIELD_OPERATION_ID: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_END_TO_END_ID: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_INFRACTION_ID: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_DEBITED_PARTICIPANT: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_CREDIT_PARTICIPANT: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_FRAUD: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_REQUEST_REFUND: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REASON_CANCEL_DEVOLUTION: string;

  APP_JIRA_INFRACTION_CUSTOM_FIELD_REPORTER: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REPORTER_DEBITED_PARTICIPANT: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_REPORTER_CREBITED_PARTICIPANT: string;

  APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_AGREE: string;
  APP_JIRA_INFRACTION_CUSTOM_FIELD_RESOLUTION_DISAGREE: string;

  APP_JIRA_INFRACTION_TRANSITION_CREATE: string;
  APP_JIRA_INFRACTION_TRANSITION_OPEN: string;
  APP_JIRA_INFRACTION_TRANSITION_RECEIVE: string;
  APP_JIRA_INFRACTION_TRANSITION_IN_ANALYSIS: string;
  APP_JIRA_INFRACTION_TRANSITION_CLOSE: string;
  APP_JIRA_INFRACTION_TRANSITION_ACK_RECEIVED: string;
  APP_JIRA_INFRACTION_TRANSITION_CANCEL: string;
  APP_JIRA_INFRACTION_TRANSITION_OPEN_FAIL: string;

  // Jira Refund Fields
  APP_JIRA_REFUND_PROJECT_ID: string;
  APP_JIRA_REFUND_REPORTER_ID: string;
  APP_JIRA_REFUND_ISSUE_TYPE_ID: string;

  APP_JIRA_REFUND_CUSTOM_FIELD_END_TO_END_ID: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_AMOUNT: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_OPERATION_ID: string;

  APP_JIRA_REFUND_TRANSITION_CANCELLED: string;
  APP_JIRA_REFUND_TRANSITION_CLOSED: string;
  APP_JIRA_REFUND_TRANSITION_RECEIVED: string;

  APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_ACCOUNT_CLOSURE_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_CANNOT_REFUND_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_NO_BALANCE_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_REJECTION_OTHER_REASON: string;

  APP_JIRA_REFUND_CUSTOM_FIELD_SOLICITATION_PSP_ID: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_DEVOLUTION_END_TO_END_ID: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_ANALISYS_DETAILS: string;

  APP_JIRA_REFUND_CUSTOM_FIELD_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_FRAUD_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_OPERATION_FLAW_REASON: string;
  APP_JIRA_REFUND_CUSTOM_FIELD_CANCELLED_REASON: string;

  // Jira User limit request
  APP_JIRA_USER_LIMIT_REQUEST_PROJECT_ID: string;
  APP_JIRA_USER_LIMIT_REQUEST_REPORTER_ID: string;
  APP_JIRA_USER_LIMIT_REQUEST_ISSUE_TYPE_ID: string;

  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_CLOSED_STATUS: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_RECEIVED_STATUS: string;

  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_ID: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_USER_ID: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_USER_LIMIT_ID: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_YEARLY_LIMIT: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MONTHLY_LIMIT: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_DAILY_LIMIT: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_NIGHTLY_LIMIT: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MAX_AMOUNT: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MIN_AMOUNT: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MAX_AMOUNT_NIGHTLY: string;
  APP_JIRA_USER_LIMIT_REQUEST_CUSTOM_FIELD_MIN_AMOUNT_NIGHTLY: string;

  // Jira Warning Transaction
  APP_JIRA_WARNING_TRANSACTION_PROJECT_ID: string;
  APP_JIRA_WARNING_TRANSACTION_REPORTER_ID: string;
  APP_JIRA_WARNING_TRANSACTION_ISSUE_TYPE_ID: string;

  APP_JIRA_CUSTOM_FIELD_WARNING_TRANSACTION_OPERATION_ID: string;
  APP_JIRA_CUSTOM_FIELD_WARNING_TRANSACTION_TRANSACTION_TAG: string;
  APP_JIRA_CUSTOM_FIELD_WARNING_TRANSACTION_END_TO_END_ID: string;
  APP_JIRA_CUSTOM_FIELD_WARNING_TRANSACTION_REASON: string;
  APP_JIRA_WARNING_TRANSACTION_TRANSITION_CLOSE: string;
  APP_JIRA_WARNING_TRANSACTION_TRANSITION_IN_ANALYSIS: string;
  APP_JIRA_WARNING_TRANSACTION_STATUS_CLOSED: string;
  APP_JIRA_WARNING_TRANSACTION_STATUS_IN_ANALYSIS: string;
  APP_JIRA_WARNING_TRANSACTION_STATUS_NEW: string;

  // Jira User withdraw setting request Transaction
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_PROJECT_ID: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_ISSUE_TYPE_ID: string;

  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_ID: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_USER_ID: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_WALLET_ID: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_TRANSACTION_TYPE_ID: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_PIX_KEY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_PIX_KEY_TYPE: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_TYPE: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_BALANCE_TYPE: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_DAILY_TYPE: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_MONTHLY_TYPE: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_WEEKLY_TYPE: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_BALANCE: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_DAY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_WEEK_DAY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_MONDAY_WEEK_DAY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_TUESDAY_WEEK_DAY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_WEDNESDAY_WEEK_DAY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_THURSDAY_WEEK_DAY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_FRIDAY_WEEK_DAY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_SATURDAY_WEEK_DAY: string;
  APP_JIRA_USER_WITHDRAW_SETTING_REQUEST_SUNDAY_WEEK_DAY: string;

  // Pix Fraud Detection
  APP_JIRA_PIX_FRAUD_DETECTION_PROJECT_ID: string;
  APP_JIRA_PIX_FRAUD_DETECTION_REPORTER_ID: string;
  APP_JIRA_PIX_FRAUD_DETECTION_ISSUE_TYPE_ID: string;
  APP_JIRA_PIX_FRAUD_DETECTION_EXTERNAL_ID: string;
  APP_JIRA_PIX_FRAUD_DETECTION_DOCUMENT: string;
  APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE: string;
  APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE_FALSE_IDENTIFICATION: string;
  APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE_DUMMY_ACCOUNT: string;
  APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE_FRAUDSTER_ACCOUNT: string;
  APP_JIRA_PIX_FRAUD_DETECTION_FRAUD_TYPE_OTHER: string;
  APP_JIRA_PIX_FRAUD_DETECTION_KEY: string;
  APP_JIRA_PIX_FRAUD_DETECTION_STATUS_REGISTERED: string;
  APP_JIRA_PIX_FRAUD_DETECTION_STATUS_RECEIVED: string;
  APP_JIRA_PIX_FRAUD_DETECTION_STATUS_CANCELED: string;
  APP_JIRA_PIX_FRAUD_DETECTION_STATUS_NEW: string;
  APP_JIRA_PIX_FRAUD_DETECTION_TRANSITION_CANCEL_RECEIVED: string;
  APP_JIRA_PIX_FRAUD_DETECTION_TRANSITION_CANCEL_REGISTERED: string;
  APP_JIRA_PIX_FRAUD_DETECTION_TRANSITION_RECEIVED: string;
}