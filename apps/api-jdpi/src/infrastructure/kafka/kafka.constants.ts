export const KAFKA_TOPICS = {};

export const KAFKA_EVENTS = {
  JDPI: {
    NOTIFY_CREDIT: 'JDPI.notify.event.transactionCredit',
    NOTIFY_DEVOLUTION: 'JDPI.notify.event.transactionDevolution',
    NOTIFY_CREDIT_VALIDATION: 'JDPI.notify.event.creditValidation',
  },
  NOTIFY_CREDIT: {
    READY: 'JDPI.notifyCreditDeposit.event.ready',
    ERROR: 'JDPI.notifyCreditDeposit.event.error',
  },
  NOTIFY_DEVOLUTION: {
    READY: 'JDPI.notifyCreditDevolution.event.ready',
    ERROR: 'JDPI.notifyCreditDevolution.event.error',
  },
  NOTIFY_CREDIT_VALIDATION: {
    READY: 'JDPI.notifyCreditValidation.event.ready',
    PENDING: 'JDPI.notifyCreditValidation.event.pending',
    ERROR: 'JDPI.notifyCreditValidation.event.error',
  },
};

export const KAFKA_HUB = {
  NOTIFY_CREDIT: {
    PAYMENT_GATEWAY: 'JDPI.notifyCreditDeposit.observer.payment',
    DEAD_LETTER: 'JDPI.notifyCreditDeposit.observer.deadLetter',
  },
  NOTIFY_DEVOLUTION: {
    PAYMENT_GATEWAY: 'JDPI.notifyCreditDevolution.observer.payment',
    DEAD_LETTER: 'JDPI.notifyCreditDevolution.observer.deadLetter',
  },
};
