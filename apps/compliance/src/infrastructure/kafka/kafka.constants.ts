export const KAFKA_TOPICS = {
  WARNING_TRANSACTION: {
    GET_BY_OPERATION: 'COMPLIANCE.warningTransaction.getByOperation',
    CREATE: 'COMPLIANCE.warningTransaction.create',
    CLOSE: 'COMPLIANCE.warningTransaction.close',
  },
  USER_LIMIT_REQUEST: {
    CREATE: 'COMPLIANCE.userLimitRequest.create',
    CLOSE: 'COMPLIANCE.userLimitRequest.close',
  },
  USER_WITHDRAW_SETTING_REQUEST: {
    CREATE: 'COMPLIANCE.userWithdrawSettingRequest.create',
    CREATE_APPROVE: 'COMPLIANCE.userWithdrawSettingRequest.createApprove',
    CLOSE: 'COMPLIANCE.userWithdrawSettingRequest.close',
    GET_BY_USER_AND_ID: 'COMPLIANCE.userWithdrawSettingRequest.getByUserAndId',
  },
};

export const KAFKA_EVENTS = {
  WARNING_TRANSACTION: {
    PENDING: 'COMPLIANCE.warningTransaction.event.pending',
    SENT: 'COMPLIANCE.warningTransaction.event.sent',
    CLOSED: 'COMPLIANCE.warningTransaction.event.closed',
    FAILED: 'COMPLIANCE.warningTransaction.event.failed',
    EXPIRED: 'COMPLIANCE.warningTransaction.event.expired',
  },
  USER_LIMIT_REQUEST: {
    OPEN_PENDING: 'COMPLIANCE.userLimitRequest.event.openPending',
    OPEN_CONFIRMED: 'COMPLIANCE.userLimitRequest.event.openConfirmed',
    CLOSED_CONFIRMED_APPROVED:
      'COMPLIANCE.userLimitRequest.event.confirmedApproved',
    CLOSED_CONFIRMED_REJECTED:
      'COMPLIANCE.userLimitRequest.event.confirmedRejected',
  },
  USER_WITHDRAW_SETTING_REQUEST: {
    PENDING: 'COMPLIANCE.userWithdrawSettingRequest.event.pending',
    OPEN: 'COMPLIANCE.userWithdrawSettingRequest.event.open',
    APPROVED: 'COMPLIANCE.userWithdrawSettingRequest.event.approved',
    REJECTED: 'COMPLIANCE.userWithdrawSettingRequest.event.rejected',
    FAILED: 'COMPLIANCE.userWithdrawSettingRequest.event.failed',
    FAILED_BY_DOCUMENT:
      'COMPLIANCE.userWithdrawSettingRequest.event.failedByDocument',
  },
};

export const KAFKA_HUB = {
  WARNING_TRANSACTION: {
    JIRA_GATEWAY: 'COMPLIANCE.warningTransaction.observer.jira',
    DEAD_LETTER: 'COMPLIANCE.warningTransaction.observer.deadLetter',
  },
};
