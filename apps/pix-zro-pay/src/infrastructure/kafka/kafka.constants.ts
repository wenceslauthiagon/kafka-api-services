export const KAFKA_TOPICS = {
  QR_CODE: {
    CREATE: 'PIX_ZRO_PAY.qrCode.create',
  },
  COMPANY: {
    GET_BY_ID_AND_X_API_KEY: 'PIX_ZRO_PAY.company.getByIdAndXApiKey',
  },
  CASHOUT_SOLICITATION: {
    GET_ALL: 'PIX_ZRO_PAY.cashOutSolicitation.getAll',
    CREATE: 'PIX_ZRO_PAY.cashOutSolicitation.create',
  },
};

export const KAFKA_EVENTS = {
  QR_CODE: {
    READY: 'PIX_ZRO_PAY.qrCode.event.ready',
  },
};
