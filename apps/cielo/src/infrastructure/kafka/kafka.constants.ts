export const KAFKA_TOPICS = {
  PAYMENT: {
    PRE_CHECKOUT: 'CIELO.payment.preCheckout',
    CREATE_CREDIT: 'CIELO.payment.create.credit',
    CREATE_DEBIT: 'CIELO.payment.create.debit',
    CREATE_AUTHENTICATED_DEBIT: 'CIELO.payment.create.authenticated.debit',
    CREATE_NON_AUTHENTICATED_DEBIT:
      'CIELO.payment.create.nonAuthenticated.debit',
    GET: 'CIELO.payment.get',
    REFUND: 'CIELO.payment.refund',
    CAPTURE: 'CIELO.payment.capture',
  },
};

export const KAFKA_EVENTS = {};

export const KAFKA_HUB = {};
