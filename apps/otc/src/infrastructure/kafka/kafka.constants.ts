export const KAFKA_TOPICS = {
  PROVIDER: {
    CREATE: 'OTC.provider.create',
    GET_ALL: 'OTC.provider.getAll',
    GET_BY_ID: 'OTC.provider.getById',
    GET_BY_NAME: 'OTC.provider.getByName',
  },
  SYSTEM: {
    GET_ALL: 'OTC.system.getAll',
    GET_BY_ID: 'OTC.system.getById',
    GET_BY_NAME: 'OTC.system.getByName',
  },
  EXCHANGE_CONTRACT: {
    CREATE: 'OTC.exchangeContract.create',
    UPDATE: 'OTC.exchangeContract.update',
    GET_ALL: 'OTC.exchangeContract.getAll',
    GENERATE_WORKSHEET: 'OTC.exchangeContract.generateWorksheet',
    UPLOAD_FILE: 'OTC.exchangeContract.uploadFile',
    REMOVE_FILE: 'OTC.exchangeContract.removeFile',
  },
  CONVERSION: {
    CREATE: 'OTC.conversion.create',
    GET_ALL: 'OTC.conversion.getAll',
    GET_BY_USER_AND_ID: 'OTC.conversion.getByUserAndId',
    GET_BY_OPERATION: 'OTC.conversion.getByOperation',
    GET_QUOTATION_BY_CONVERSION_ID_AND_USER:
      'OTC.conversion.getQuotationByConversionIdAndUser',
    GET_BY_OPERATION_ID: 'OTC.conversion.getByOperationId',
    GET_RECEIPT_BY_USER_AND_OPERATION:
      'OTC.conversion.getReceiptByUserAndOperation',
  },
  CONVERSION_CREDIT: {
    GET_BY_USER: 'OTC.conversionCredit.getByUser',
  },
  SPREAD: {
    GET_ALL: 'OTC.spread.getAll',
    GET_BY_ID: 'OTC.spread.getById',
    GET_BY_CURRENCY: 'OTC.spread.getByCurrency',
    GET_BY_USER_AND_CURRENCY: 'OTC.spread.getByUserAndCurrency',
    GET_BY_USER_AND_CURRENCIES: 'OTC.spread.getByUserAndCurrencies',
    CREATE: 'OTC.spread.create',
    DELETE: 'OTC.spread.delete',
  },
  CASHBACK: {
    CREATE: 'OTC.cashback.create',
  },
  CRYPTO: {
    GET_PRICE_BY_CURRENCY_AND_DATE:
      'OTC.crypto.getCryptoPriceByCurrencyAndDate',
  },
  CRYPTO_REMITTANCE: {
    CREATE: 'OTC.cryptoRemittance.create',
    UPDATE: 'OTC.cryptoRemittance.update',
    GET_BY_ID: 'OTC.cryptoRemittance.getById',
  },
  CRYPTO_ORDER: {
    CREATE: 'OTC.cryptoOrder.create',
    UPDATE: 'OTC.cryptoOrder.update',
    GET_BY_ID: 'OTC.cryptoOrder.getById',
  },
  REMITTANCE_EXPOSURE_RULE: {
    CREATE: 'OTC.remittanceExposureRule.create',
    UPDATE: 'OTC.remittanceExposureRule.update',
    GET_ALL: 'OTC.remittanceExposureRule.getAll',
  },
  EXCHANGE_QUOTATION: {
    GET_ALL: 'OTC.exchangeQuotation.getAll',
  },
  CRYPTO_REPORT: {
    GET_BY_CURRENCY_AND_FORMAT:
      'OTC.cryptoReport.getCryptoReportByCurrencyAndFormat',
  },
  REMITTANCE: {
    GET_BY_ID: 'OTC.remittance.getById',
    GET_ALL: 'OTC.remittance.getAll',
    MANUALLY_CLOSE_REMITTANCE: 'OTC.remittance.manuallyCloseRemittance',
  },
  REMITTANCE_ORDER: {
    CREATE: 'OTC.remittanceOrder.create',
    GET_ALL_BY_FILTER: 'OTC.remittanceOrder.getAllByFilter',
    GET_BY_ID: 'OTC.remittanceOrder.getById',
  },
};

export const KAFKA_EVENTS = {
  REMITTANCE: {
    CREATED: 'OTC.remittance.event.created',
    CLOSED: 'OTC.remittance.event.closed',
    WAITING: 'OTC.remittance.event.waiting',
    MANUALLY_CLOSED: 'OTC.remittance.event.manuallyClosed',
  },
  REMITTANCE_ORDER: {
    CREATED: 'OTC.remittanceOrder.event.created',
    CLOSED: 'OTC.remittanceOrder.event.closed',
  },
  EXCHANGE_CONTRACT: {
    CREATED: 'OTC.exchange_contract.event.created',
  },
  SPREAD: {
    CREATED: 'OTC.spread.event.created',
    DELETED: 'OTC.spread.event.deleted',
  },
  CONVERSION: {
    READY: 'OTC.conversion.event.ready',
  },
  CASHBACK: {
    READY: 'OTC.cashback.event.ready',
  },
  CRYPTO_ORDER: {
    PENDING: 'OTC.cryptoOrder.event.pending',
    CONFIRMED: 'OTC.cryptoOrder.event.confirmed',
    FAILED: 'OTC.cryptoOrder.event.failed',
    ERROR: 'OTC.cryptoOrder.event.error',
  },
  CRYPTO_REMITTANCE: {
    PENDING: 'OTC.cryptoRemittance.event.pending',
    CONFIRMED: 'OTC.cryptoRemittance.event.confirmed',
    FAILED: 'OTC.cryptoRemittance.event.failed',
    ERROR: 'OTC.cryptoRemittance.event.error',
    FILLED: 'OTC.cryptoRemittance.event.filled',
  },
  EXCHANGE_QUOTATION: {
    ACCEPT: 'OTC.exchangeQuotation.event.accept',
    READY: 'OTC.exchangeQuotation.event.ready',
    APPROVED: 'OTC.exchangeQuotation.event.approved',
    COMPLETED: 'OTC.exchangeQuotation.event.completed',
    REJECTED: 'OTC.exchangeQuotation.event.rejected',
    CANCELED: 'OTC.exchangeQuotation.event.canceled',
  },
  REMITTANCE_EXPOSURE_RULE: {
    CREATED: 'OTC.remittanceExposureRule.event.created',
    UPDATED: 'OTC.remittanceExposureRule.event.updated',
  },
};

export const KAFKA_HUB = {
  EXCHANGE_QUOTATION: {
    CREATE: {
      TOPAZIO_GATEWAY: 'OTC.exchangeQuotation.create.observer.topazio',
      DEAD_LETTER: 'OTC.exchangeQuotation.create.observer.deadLetter',
    },
    ACCEPT: {
      TOPAZIO_GATEWAY: 'OTC.exchangeQuotation.accept.observer.topazio',
      DEAD_LETTER: 'OTC.exchangeQuotation.accept.observer.deadLetter',
    },
    REJECT: {
      TOPAZIO_GATEWAY: 'OTC.exchangeQuotation.reject.observer.topazio',
      DEAD_LETTER: 'OTC.exchangeQuotation.reject.observer.deadLetter',
    },
  },
};
