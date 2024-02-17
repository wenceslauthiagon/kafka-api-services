export const KAFKA_TOPICS = {
  DEVOLUTION: {
    GET_ALL: 'PAYMENTS_GATEWAY.devolution.getAll',
    GET_BY_ID: 'PAYMENTS_GATEWAY.devolution.getById',
  },
  DEPOSIT: {
    GET_ALL: 'PAYMENTS_GATEWAY.deposit.getAll',
    GET_BY_ID: 'PAYMENTS_GATEWAY.deposit.getById',
  },
  DASHBOARD: {
    GET_ALL: 'PAYMENTS_GATEWAY.dashboard.getAll',
  },
  REFUND: {
    GET_ALL: 'PAYMENTS_GATEWAY.refund.getAll',
    GET_BY_ID: 'PAYMENTS_GATEWAY.refund.getById',
  },
  COMPANY: {
    GET_COMPANY: 'PAYMENTS_GATEWAY.company.getCompany',
  },
  ORDER: {
    GET_ALL: 'PAYMENTS_GATEWAY.order.getAll',
    GET_BY_ID: 'PAYMENTS_GATEWAY.order.getById',
  },
  ORDER_REFUNDS: {
    GET_ALL: 'PAYMENTS_GATEWAY.order.refunds.getAll',
    GET_BY_ID: 'PAYMENTS_GATEWAY.order.refunds.getById',
  },
  WITHDRAWAL: {
    GET_ALL: 'PAYMENTS_GATEWAY.withdrawal.getAll',
    GET_BY_ID: 'PAYMENTS_GATEWAY.withdrawal.getById',
  },
  WALLET: {
    CHECK: 'PAYMENTS_GATEWAY.wallet.check',
  },
  SUPPORTS: {
    WITHDRAW: 'PAYMENTS_GATEWAY.support.withdraw',
    REFUND: 'PAYMENTS_GATEWAY.support.refund',
  },
  VALIDATION: {
    KYC_COUNT: 'PAYMENTS_GATEWAY.validation.kycCount',
    ADMIN_KYC_COUNT: 'PAYMENTS_GATEWAY.validation.adminKycCount',
    CLIENT_KYC_COUNT: 'PAYMENTS_GATEWAY.validation.clientKycCount',
  },
};

export const KAFKA_EVENTS = {};

export const KAFKA_HUB = {};
