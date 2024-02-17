export const CRON_TASKS = {
  PAYMENT: {
    SYNC_SCHEDULED: 'PIX_PAYMENTS.payment.syncScheduled',
    SYNC_WAITING: 'PIX_PAYMENTS.payment.syncWaiting',
    SYNC_WAITING_RECENT: 'PIX_PAYMENTS.payment.syncWaitingRecent',
  },
  PIX_DEVOLUTION: {
    SYNC_WAITING: 'PIX_PAYMENTS.pixDevolution.syncWaiting',
    SYNC_WAITING_RECENT: 'PIX_PAYMENTS.pixDevolution.syncWaitingRecent',
  },
  PIX_REFUND_DEVOLUTION: {
    SYNC_WAITING: 'PIX_PAYMENTS.pixRefundDevolution.syncWaiting',
    SYNC_WAITING_RECENT: 'PIX_PAYMENTS.pixRefundDevolution.syncWaitingRecent',
  },
  WARNING_PIX_DEVOLUTION: {
    SYNC_WAITING: 'PIX_PAYMENTS.warningPixDevolution.syncWaiting',
    SYNC_WAITING_RECENT: 'PIX_PAYMENTS.warningPixDevolution.syncWaitingRecent',
  },
  PIX_FRAUD_DETECTION: {
    SYNC: 'PIX_PAYMENTS.pixFraudDetection.sync',
  },
  PIX_REFUND: {
    SYNC: 'PIX_PAYMENTS.pixRefund.sync',
  },
  PIX_INFRACTION: {
    SYNC: 'PIX_PAYMENTS.pixInfraction.sync',
  },
};
