export const CRON_TASKS = {
  CRYPTO_ORDER: {
    SYNC_PENDING: 'OTC.cryptoOrder.syncPending',
    SYNC_GET_CURRENCIES: 'OTC.cryptoOrder.getCurrencies',
  },
  REMITTANCE: {
    SYNC_CREATE: 'OTC.remittance.syncCreate',
    SYNC_OPEN: 'OTC.remittance.syncOpen',
  },
  CRYPTO_REPORT: {
    SYNC_UPDATE: 'OTC.cryptoReport.syncUpdate',
  },
  EXCHANGE_QUOTATION: {
    SYNC_STATE: 'OTC.remittance.syncState',
  },
};
