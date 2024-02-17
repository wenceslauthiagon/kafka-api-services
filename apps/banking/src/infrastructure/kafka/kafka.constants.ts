export const KAFKA_TOPICS = {
  BANK: {
    GET_ALL: 'BANKING.bank.getAll',
    UPDATE: 'BANKING.bank.update',
    GET_BY_ISPB: 'BANKING.bank.getByIspb',
    GET_BY_ID: 'BANKING.bank.getById',
  },
  BANK_TED: {
    GET_ALL: 'BANKING.bankTed.getAll',
    GET_BY_CODE: 'BANKING.bankTed.getByCode',
  },
  BANKING_TED: {
    GET_ALL: 'BANKING.bankingTed.getAll',
    GET_BY_ID: 'BANKING.bankingTed.getById',
    CREATE: 'BANKING.bankingTed.create',
    GET_BY_TRANSACTION_ID: 'BANKING.bankingTed.getByTransactionId',
    CONFIRM: 'BANKING.bankingTed.confirm',
    REJECT: 'BANKING.bankingTed.reject',
    FORWARD: 'BANKING.bankingTed.forward',
    GET_RECEIPT_BY_USER_AND_OPERATION:
      'BANKING.bankingTed.getReceiptByUserAndOperation',
    GET_BY_OPERATION: 'BANKING.bankingTed.getByOperation',
  },
  BANKING_CONTACT: {
    GET_ALL: 'BANKING.bankingContact.getAll',
    DELETE_BY_ID_AND_USER: 'BANKING.bankingContact.deleteByIdAndUser',
  },
  ADMIN_BANKING_ACCOUNT: {
    GET_ALL: 'BANKING.adminBankingAccount.getAll',
  },
  ADMIN_BANKING_TED: {
    GET_ALL: 'BANKING.adminBankingTed.getAll',
    GET_BY_ID: 'BANKING.adminBankingTed.getById',
    CREATE: 'BANKING.adminBankingTed.create',
    GET_BY_TRANSACTION_ID: 'BANKING.adminBankingTed.getByTransactionId',
    CONFIRM: 'BANKING.adminBankingTed.confirm',
    REJECT: 'BANKING.adminBankingTed.reject',
    FORWARD: 'BANKING.adminBankingTed.forward',
  },
  BANKING_TED_RECEIVED: {
    GET_BY_OPERATION: 'BANKING.bankingTedReceived.getByOperation',
  },
};

export const KAFKA_EVENTS = {
  BANK: {
    CREATED: 'BANKING.bank.event.created',
    UPDATED: 'BANKING.bank.event.updated',
    DELETED: 'BANKING.bank.event.deleted',
  },
  BANK_TED: {
    CREATED: 'BANKING.bankTed.event.created',
    UPDATED: 'BANKING.bankTed.event.updated',
    DELETED: 'BANKING.bankTed.event.deleted',
  },
  CITY: {
    CREATED: 'BANKING.city.event.created',
    UPDATED: 'BANKING.city.event.updated',
    DELETED: 'BANKING.city.event.deleted',
  },
  BANKING_TED: {
    PENDING: 'BANKING.bankingTed.event.pending',
    WAITING: 'BANKING.bankingTed.event.waiting',
    FORWARDED: 'BANKING.bankingTed.event.forwarded',
    FAILED: 'BANKING.bankingTed.event.failed',
    CONFIRMED: 'BANKING.bankingTed.event.confirmed',
  },
  ADMIN_BANKING_TED: {
    PENDING: 'BANKING.adminBankingTed.event.pending',
    WAITING: 'BANKING.adminBankingTed.event.waiting',
    FORWARDED: 'BANKING.adminBankingTed.event.forwarded',
    FAILED: 'BANKING.adminBankingTed.event.failed',
    CONFIRMED: 'BANKING.adminBankingTed.event.confirmed',
  },
  BANKING_TED_RECEIVED: {
    SENT: 'BANKING.bankingTedReceived.event.received',
  },
};

export const KAFKA_HUB = {
  BANKING_TED: {
    PENDING: {
      TOPAZIO_GATEWAY: 'BANKING.bankingTed.pending.observer.topazio',
      DEAD_LETTER: 'BANKING.bankingTed.pending.observer.deadLetter',
    },
  },
  ADMIN_BANKING_TED: {
    PENDING: {
      TOPAZIO_GATEWAY: 'BANKING.adminBankingTed.pending.observer.topazio',
      DEAD_LETTER: 'BANKING.adminBankingTed.pending.observer.deadLetter',
    },
  },
};
