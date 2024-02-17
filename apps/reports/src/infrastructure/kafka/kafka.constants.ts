export const KAFKA_TOPICS = {
  REPORT_OPERATION: {
    CREATE_BY_GATEWAY: 'REPORTS.reportOperation.createByGateway',
    CREATE: 'REPORTS.reportOperation.create',
  },
  REPORT_USER: {
    CREATE: 'REPORTS.reportUser.create',
  },
  REPORT_USER_LEGAL_REPRESENTOR: {
    CREATE: 'REPORTS.reportUserLegalRepresentor.create',
  },
};

export const KAFKA_EVENTS = {};

export const KAFKA_HUB = {
  REPORT_OPERATION: {
    PIX_PAYMENT: {
      DEAD_LETTER: 'REPORTS.reportOperation.pixPayment.deadLetter',
    },
    PIX_DEPOSIT: {
      DEAD_LETTER: 'REPORTS.reportOperation.pixDeposit.deadLetter',
    },
    PIX_DEVOLUTION: {
      DEAD_LETTER: 'REPORTS.reportOperation.pixDevolution.deadLetter',
    },
    PIX_DEVOLUTION_RECEIVED: {
      DEAD_LETTER: 'REPORTS.reportOperation.pixDevolutionReceived.deadLetter',
    },
  },
};
