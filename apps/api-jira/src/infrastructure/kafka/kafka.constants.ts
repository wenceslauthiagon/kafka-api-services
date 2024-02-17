export const KAFKA_TOPICS = {};

export const KAFKA_EVENTS = {
  ISSUE: {
    INFRACTION: {
      NOTIFY_CREATE: 'JIRA.notify.event.infraction.notifyCreate',
      NOTIFY_UPDATE: 'JIRA.notify.event.infraction.notifyUpdate',
    },
    REFUND: {
      NOTIFY_UPDATE: 'JIRA.notify.event.refund.notifyUpdate',
    },
    USER_LIMIT_REQUEST: {
      NOTIFY_UPDATE: 'JIRA.notify.event.userLimitRequest.notifyUpdate',
    },
    WARNING_TRANSACTION: {
      NOTIFY_UPDATE: 'JIRA.notify.event.warningTransaction.notifyUpdate',
    },
    USER_WITHDRAW_SETTING_REQUEST: {
      NOTIFY_UPDATE:
        'JIRA.notify.event.userWithdrawSettingRequest.notifyUpdate',
    },
    FRAUD_DETECTION: {
      NOTIFY_UPDATE: 'JIRA.notify.event.fraudDetection.notifyUpdate',
    },
  },
  NOTIFY_ISSUE: {
    INFRACTION: {
      READY: 'JIRA.notifyIssue.event.infraction.ready',
      ERROR: 'JIRA.notifyIssue.event.infraction.error',
    },
    REFUND: {
      READY: 'JIRA.notifyIssue.event.refund.ready',
      ERROR: 'JIRA.notifyIssue.event.refund.error',
    },
    USER_LIMIT_REQUEST: {
      READY: 'JIRA.notifyIssue.event.userLimitRequest.ready',
      ERROR: 'JIRA.notifyIssue.event.userLimitRequest.error',
    },
    WARNING_TRANSACTION: {
      READY: 'JIRA.notifyIssue.event.warningTransaction.ready',
      ERROR: 'JIRA.notifyIssue.event.warningTransaction.error',
    },
    FRAUD_DETECTION: {
      READY: 'JIRA.notifyIssue.event.fraudDetection.ready',
      ERROR: 'JIRA.notifyIssue.event.fraudDetection.error',
    },
  },
};

export const KAFKA_HUB = {
  ISSUE: {
    INFRACTION: {
      NOTIFY_CREATE: {
        PAYMENT_GATEWAY: 'JIRA.issue.notifyCreate.observer.infraction',
        DEAD_LETTER: 'JIRA.issue.notifyCreate.observer.deadLetter.infraction',
      },
      NOTIFY_CANCEL: {
        PAYMENT_GATEWAY: 'JIRA.issue.notifyCancel.observer.infraction',
        DEAD_LETTER: 'JIRA.issue.notifyCancel.observer.deadLetter.infraction',
      },
      NOTIFY_UPDATE: {
        PAYMENT_GATEWAY: 'JIRA.issue.notifyUpdate.observer.infraction',
        DEAD_LETTER: 'JIRA.issue.notifyUpdate.observer.deadLetter.infraction',
      },
    },
    REFUND: {
      NOTIFY_CANCEL: {
        PAYMENT_GATEWAY: 'JIRA.issue.notifyCancel.observer.refund',
        DEAD_LETTER: 'JIRA.issue.notifyCancel.observer.deadLetter.refund',
      },
      NOTIFY_UPDATE: {
        PAYMENT_GATEWAY: 'JIRA.issue.notifyUpdate.observer.refund',
        DEAD_LETTER: 'JIRA.issue.notifyUpdate.observer.deadLetter.refund',
      },
    },
    USER_LIMIT_REQUEST: {
      NOTIFY_UPDATE: {
        PAYMENT_GATEWAY:
          'JIRA.issue.notifyUpdate.observer.paymentGateway.userLimitRequest',
        DEAD_LETTER:
          'JIRA.issue.notifyUpdate.observer.deadLetter.userLimitRequest',
      },
    },
    WARNING_TRANSACTION: {
      NOTIFY_UPDATE: {
        COMPLIANCE_GATEWAY:
          'JIRA.issue.notifyUpdate.observer.warningTransaction',
        DEAD_LETTER:
          'JIRA.issue.notifyUpdate.observer.deadLetter.warningTransaction',
      },
    },
    USER_WITHDRAW_SETTING_REQUEST: {
      NOTIFY_UPDATE: {
        COMPLIANCE_GATEWAY:
          'JIRA.issue.notifyUpdate.observer.userWithdrawSettingRequest',
        DEAD_LETTER:
          'JIRA.issue.notifyUpdate.observer.deadLetter.userWithdrawSettingRequest',
      },
    },
    FRAUD_DETECTION: {
      NOTIFY_UPDATE: {
        PAYMENT_GATEWAY: 'JIRA.issue.notifyUpdate.observer.fraudDetection',
        DEAD_LETTER:
          'JIRA.issue.notifyUpdate.observer.deadLetter.fraudDetection',
      },
    },
  },
};
