export const KAFKA_TOPICS = {};

export const KAFKA_EVENTS = {
  TOPAZIO: {
    NOTIFY_CREDIT: 'TOPAZIO.notify.event.transactionCredit',
    NOTIFY_DEBIT: 'TOPAZIO.notify.event.transactionDebit',
    NOTIFY_COMPLETION: 'TOPAZIO.notify.event.completion',
    NOTIFY_CLAIMS: 'TOPAZIO.notify.event.claims',
    NOTIFY_INFRACTION: 'TOPAZIO.notify.event.infraction',
    NOTIFY_REFUND: 'TOPAZIO.notify.event.refund',
    NOTIFY_REGISTER_BANKING_TED: 'TOPAZIO.notify.event.registerBankingTed',
    NOTIFY_CONFIRM_BANKING_TED: 'TOPAZIO.notify.event.confirmBankingTed',
    REPROCESS_PIX_STATEMENT: 'TOPAZIO.pixStatement.event.reprocess',
  },
  NOTIFY_CREDIT: {
    READY: 'TOPAZIO.notifyCredit.event.ready',
    ERROR: 'TOPAZIO.notifyCredit.event.error',
  },
  NOTIFY_DEBIT: {
    READY: 'TOPAZIO.notifyDebit.event.ready',
    ERROR: 'TOPAZIO.notifyDebit.event.error',
  },
  NOTIFY_COMPLETION: {
    READY: 'TOPAZIO.notifyCompletion.event.ready',
    ERROR: 'TOPAZIO.notifyCompletion.event.error',
  },
  NOTIFY_CLAIM: {
    READY: 'TOPAZIO.notifyClaim.event.ready',
    ERROR: 'TOPAZIO.notifyClaim.event.error',
  },
  NOTIFY_INFRACTION: {
    READY: 'TOPAZIO.notifyInfraction.event.ready',
    ERROR: 'TOPAZIO.notifyInfraction.event.error',
  },
  NOTIFY_REGISTER_BANKING_TED: {
    READY: 'TOPAZIO.notifyRegisterBankingTed.event.ready',
    ERROR: 'TOPAZIO.notifyRegisterBankingTed.event.error',
  },
  NOTIFY_CONFIRM_BANKING_TED: {
    READY: 'TOPAZIO.notifyConfirmBankingTed.event.ready',
    ERROR: 'TOPAZIO.notifyConfirmBankingTed.event.error',
  },
};

export const KAFKA_HUB = {
  NOTIFY_CLAIM: {
    PIX_GATEWAY: 'TOPAZIO.notifyClaim.observer.pix',
    DEAD_LETTER: 'TOPAZIO.notifyClaim.observer.deadLetter',
  },
  NOTIFY_COMPLETION: {
    PAYMENT_GATEWAY: 'TOPAZIO.notifyCompletion.observer.payment',
    DEAD_LETTER: 'TOPAZIO.notifyCompletion.observer.deadLetter',
  },
  NOTIFY_CREDIT: {
    PAYMENT_GATEWAY: 'TOPAZIO.notifyCredit.observer.payment',
    DEAD_LETTER: 'TOPAZIO.notifyCredit.observer.deadLetter',
  },
  NOTIFY_DEBIT: {
    PAYMENT_GATEWAY: 'TOPAZIO.notifyDebit.observer.payment',
    DEAD_LETTER: 'TOPAZIO.notifyDebit.observer.deadLetter',
  },
  NOTIFY_INFRACTION: {
    PAYMENT_GATEWAY: 'TOPAZIO.notifyInfraction.observer.pix',
    DEAD_LETTER: 'TOPAZIO.notifyInfraction.observer.deadLetter',
  },
  NOTIFY_REFUND: {
    PAYMENT_GATEWAY: 'TOPAZIO.notifyRefund.observer.pix',
    DEAD_LETTER: 'TOPAZIO.notifyRefund.observer.deadLetter',
  },
  NOTIFY_REGISTER_BANKING_TED: {
    BANKING_GATEWAY: 'TOPAZIO.notifyRegisterBankingTed.observer.banking',
    DEAD_LETTER: 'TOPAZIO.notifyRegisterBankingTed.observer.deadLetter',
  },
  NOTIFY_COMPLETION_BANKING_TED: {
    BANKING_GATEWAY: 'TOPAZIO.notifyCompletionBankingTed.observer.banking',
    DEAD_LETTER: 'TOPAZIO.notifyCompletionBankingTed.observer.deadLetter',
  },
  NOTIFY_QUOTATION: {
    PAYMENT_GATEWAY: 'TOPAZIO.notifyQuotation.observer.otc',
    DEAD_LETTER: 'TOPAZIO.notifyQuotation.observer.deadLetter',
  },
};
