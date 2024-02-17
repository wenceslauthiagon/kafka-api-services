export const KAFKA_TOPICS = {
  QR_CODE_STATIC: {
    CREATE: 'PIX_PAYMENTS.qrCodeStatic.create',
    GET_ALL_BY_USER: 'PIX_PAYMENTS.qrCodeStatic.getAllByUser',
    GET_BY_ID: 'PIX_PAYMENTS.qrCodeStatic.getById',
    DELETE_BY_ID: 'PIX_PAYMENTS.qrCodeStatic.deleteById',
  },
  PAYMENT: {
    GET_BY_ID: 'PIX_PAYMENTS.payment.getById',
    CANCEL_BY_ID: 'PIX_PAYMENTS.payment.cancelById',
    CREATE_BY_ACCOUNT: 'PIX_PAYMENTS.payment.createByAccount',
    CREATE_BY_PIX_KEY: 'PIX_PAYMENTS.payment.createByPixKey',
    CREATE_BY_QR_CODE_STATIC: 'PIX_PAYMENTS.payment.createByQrCodeStatic',
    WITHDRAWAL_BY_QR_CODE_STATIC:
      'PIX_PAYMENTS.payment.withdrawalByQrCodeStatic',
    CREATE_BY_QR_CODE_DYNAMIC: 'PIX_PAYMENTS.payment.createByQrCodeDynamic',
    WITHDRAWAL_BY_QR_CODE_DYNAMIC:
      'PIX_PAYMENTS.payment.withdrawalByQrCodeDynamic',
    DUEDATE_BY_QR_CODE_DYNAMIC: 'PIX_PAYMENTS.payment.duedateByQrCodeDynamic',
    CHANGE_BY_QR_CODE_DYNAMIC: 'PIX_PAYMENTS.payment.changeByQrCodeDynamic',
    GET_ALL: 'PIX_PAYMENTS.payment.getAll',
    GET_ALL_BY_WALLET: 'PIX_PAYMENTS.payment.getAllByWallet',
    GET_RECEIPT_BY_OPERATION_ID: 'PIX_PAYMENTS.payment.getReceiptByOperationId',
    RECEIVE_CHARGEBACK: 'PIX_PAYMENTS.payment.receiveChargeback',
    GET_BY_OPERATION_ID: 'PIX_PAYMENTS.payment.getByOperationId',
    GET_BY_END_TO_END_ID: 'PIX_PAYMENTS.payment.getByEndToEndId',
    CREATE_BY_ACCOUNT_AND_DECODED:
      'PIX_PAYMENTS.payment.createByAccountAndDecoded',
  },
  DECODED_QR_CODE: {
    CREATE: 'PIX_PAYMENTS.decodedQrCode.create',
    GET_BY_ID: 'PIX_PAYMENTS.decodedQrCode.getById',
  },
  PIX_DEVOLUTION: {
    CREATE: 'PIX_PAYMENTS.pixDevolution.create',
    GET_BY_ID: 'PIX_PAYMENTS.pixDevolution.getById',
    RECEIVE_CHARGEBACK: 'PIX_PAYMENTS.pixDevolution.receiveChargeback',
    GET_BY_OPERATION_ID: 'PIX_PAYMENTS.pixDevolution.getByOperationId',
    GET_ALL: 'PIX_PAYMENTS.pixDevolution.getAll',
    GET_ALL_BY_WALLET: 'PIX_PAYMENTS.pixDevolution.getAllByWallet',
  },
  DECODED_PIX_ACCOUNT: {
    CREATE: 'PIX_PAYMENTS.decodedPixAccount.create',
  },
  PIX_INFRACTION: {
    CREATE: 'PIX_PAYMENTS.pixInfraction.create',
    OPEN: 'PIX_PAYMENTS.pixInfraction.open',
    IN_ANALYSIS: 'PIX_PAYMENTS.pixInfraction.inAnalysis',
    CLOSE: 'PIX_PAYMENTS.pixInfraction.close',
    GET_BY_PSP_ID: 'PIX_PAYMENTS.pixInfraction.getByPspId',
    CANCEL: 'PIX_PAYMENTS.pixInfraction.cancel',
  },
  PIX_DEPOSIT: {
    RECEIVE: 'PIX_PAYMENTS.pixDeposit.receive',
    GET_BY_OPERATION_ID: 'PIX_PAYMENTS.pixDeposit.getByOperationId',
    GET_ALL: 'PIX_PAYMENTS.pixDeposit.getAll',
    GET_ALL_BY_WALLET: 'PIX_PAYMENTS.pixDeposit.getAllByWallet',
    APPROVE: 'PIX_PAYMENTS.pixDeposit.approve',
    BLOCK: 'PIX_PAYMENTS.pixDeposit.block',
    GET_BY_ID: 'PIX_PAYMENTS.pixDeposit.getById',
  },
  PIX_DEVOLUTION_RECEIVED: {
    RECEIVE: 'PIX_PAYMENTS.pixDevolutionReceived.receive',
    GET_BY_OPERATION_ID: 'PIX_PAYMENTS.pixDevolutionReceived.getByOperationId',
    GET_BY_ID: 'PIX_PAYMENTS.pixDevolutionReceived.getById',
    GET_ALL: 'PIX_PAYMENTS.pixDevolutionReceived.getAll',
    GET_ALL_BY_WALLET: 'PIX_PAYMENTS.pixDevolutionReceived.getAllByWallet',
  },
  PIX_REFUND: {
    CLOSE: 'PIX_PAYMENTS.pixRefund.close',
    CANCEL: 'PIX_PAYMENTS.pixRefund.cancel',
  },
  WARNING_PIX_DEPOSIT: {
    GET_ALL: 'PIX_PAYMENTS.warningPixDeposit.getAll',
  },
  QR_CODE_DYNAMIC: {
    GET_BY_ID: 'PIX_PAYMENTS.qrCodeDynamic.getById',
    CREATE: 'PIX_PAYMENTS.qrCodeDynamic.create',
  },
  QR_CODE_DYNAMIC_DUE_DATE: {
    CREATE: 'PIX_PAYMENTS.qrCodeDynamicDueDate.create',
    GET_BY_ID: 'PIX_PAYMENTS.qrCodeDynamicDueDate.getById',
  },
  WARNING_PIX_DEVOLUTION: {
    CREATE: 'PIX_PAYMENTS.warningPixDevolution.create',
    GET_BY_ID: 'PIX_PAYMENTS.warningPixDevolution.getById',
  },
  PIX_FRAUD_DETECTION: {
    REGISTERED: 'PIX_PAYMENTS.pixFraudDetection.registered',
    CANCELED_REGISTERED: 'PIX_PAYMENTS.pixFraudDetection.canceledRegistered',
  },
};

export const KAFKA_EVENTS = {
  QR_CODE_STATIC: {
    ERROR: 'PIX_PAYMENTS.qrCodeStatic.event.error',
    READY: 'PIX_PAYMENTS.qrCodeStatic.event.ready',
    DELETED: 'PIX_PAYMENTS.qrCodeStatic.event.deleted',
    DELETING: 'PIX_PAYMENTS.qrCodeStatic.event.deleting',
    PENDING: 'PIX_PAYMENTS.qrCodeStatic.event.pending',
  },
  DECODED_QR_CODE: {
    ERROR: 'PIX_PAYMENTS.decodedQrCode.event.error',
    READY: 'PIX_PAYMENTS.decodedQrCode.event.ready',
    PENDING: 'PIX_PAYMENTS.decodedQrCode.event.pending',
  },
  PAYMENT: {
    SCHEDULED: 'PIX_PAYMENTS.payment.event.scheduled',
    PENDING: 'PIX_PAYMENTS.payment.event.pending',
    CONFIRMED: 'PIX_PAYMENTS.payment.event.confirmed',
    WAITING: 'PIX_PAYMENTS.payment.event.waiting',
    FAILED: 'PIX_PAYMENTS.payment.event.failed',
    CANCELED: 'PIX_PAYMENTS.payment.event.canceled',
    ERROR: 'PIX_PAYMENTS.payment.event.error',
    COMPLETED: 'PIX_PAYMENTS.payment.event.completed',
    REVERTED: 'PIX_PAYMENTS.payment.event.reverted',
  },
  PIX_DEVOLUTION: {
    PENDING: 'PIX_PAYMENTS.pixDevolution.event.pending',
    CONFIRMED: 'PIX_PAYMENTS.pixDevolution.event.confirmed',
    WAITING: 'PIX_PAYMENTS.pixDevolution.event.waiting',
    FAILED: 'PIX_PAYMENTS.pixDevolution.event.failed',
    CANCELED: 'PIX_PAYMENTS.pixDevolution.event.canceled',
    ERROR: 'PIX_PAYMENTS.pixDevolution.event.error',
    COMPLETED: 'PIX_PAYMENTS.pixDevolution.event.completed',
    REVERTED: 'PIX_PAYMENTS.pixDevolution.event.reverted',
    CREATE_FAILED: 'PIX_PAYMENTS.pixDevolution.event.createFailed',
    PENDING_FAILED: 'PIX_PAYMENTS.pixDevolution.event.pendingFailed',
  },
  PIX_REFUND_DEVOLUTION: {
    CREATED: 'PIX_PAYMENTS.pixRefundDevolution.event.created',
    CONFIRMED: 'PIX_PAYMENTS.pixRefundDevolution.event.confirmed',
    COMPLETED: 'PIX_PAYMENTS.pixRefundDevolution.event.completed',
    REVERTED: 'PIX_PAYMENTS.pixRefundDevolution.event.reverted',
    PENDING: 'PIX_PAYMENTS.pixRefundDevolution.event.pending',
    FAILED: 'PIX_PAYMENTS.pixRefundDevolution.event.failed',
    WAITING: 'PIX_PAYMENTS.pixRefundDevolution.event.waiting',
  },
  PIX_DEVOLUTION_RECEIVED: {
    READY: 'PIX_PAYMENTS.pixDevolutionReceived.event.ready',
    ERROR: 'PIX_PAYMENTS.pixDevolutionReceived.event.error',
  },
  DECODED_PIX_ACCOUNT: {
    PENDING: 'PIX_PAYMENTS.decodedPixAccount.event.pending',
    CONFIRMED: 'PIX_PAYMENTS.decodedPixAccount.event.confirmed',
  },
  PIX_DEPOSIT: {
    WAITING: 'PIX_PAYMENTS.pixDeposit.event.waiting',
    ERROR: 'PIX_PAYMENTS.pixDeposit.event.error',
    RECEIVED: 'PIX_PAYMENTS.pixDeposit.event.received',
    BLOCKED: 'PIX_PAYMENTS.pixDeposit.event.blocked',
    NEW: 'PIX_PAYMENTS.pixDeposit.event.new',
    NEW_FAILED: 'PIX_PAYMENTS.pixDeposit.event.newFailed',
    RECEIVED_FAILED: 'PIX_PAYMENTS.pixDeposit.event.receivedFailed',
  },
  PIX_INFRACTION: {
    NEW: 'PIX_PAYMENTS.pixInfraction.event.new',
    CANCEL_PENDING: 'PIX_PAYMENTS.pixInfraction.event.cancelPending',
    CANCEL_CONFIRMED: 'PIX_PAYMENTS.pixInfraction.event.cancelConfirmed',
    OPEN_PENDING: 'PIX_PAYMENTS.pixInfraction.event.openPending',
    OPEN_CONFIRMED: 'PIX_PAYMENTS.pixInfraction.event.openConfirmed',
    IN_ANALYSIS_CONFIRMED:
      'PIX_PAYMENTS.pixInfraction.event.inAnalysisConfirmed',
    ACKNOWLEDGED_PENDING:
      'PIX_PAYMENTS.pixInfraction.event.acknowledgedPending',
    ACKNOWLEDGED_CONFIRMED:
      'PIX_PAYMENTS.pixInfraction.event.acknowledgedConfirmed',
    CLOSED_PENDING_RECEIVED:
      'PIX_PAYMENTS.pixInfraction.event.closedPendingReceived',
    CLOSED_CONFIRMED_RECEIVED:
      'PIX_PAYMENTS.pixInfraction.event.closedConfirmedReceived',
    CLOSED_PENDING: 'PIX_PAYMENTS.pixInfraction.event.closedPending',
    CLOSED_CONFIRMED: 'PIX_PAYMENTS.pixInfraction.event.closedConfirmed',
    RECEIVE_PENDING: 'PIX_PAYMENTS.pixInfraction.event.receivePending',
    RECEIVE_CONFIRMED: 'PIX_PAYMENTS.pixInfraction.event.receiveConfirmed',
    REVERTED: 'PIX_PAYMENTS.pixInfraction.event.reverted',
    EXPIRED: 'PIX_PAYMENTS.pixInfraction.event.expired',
    REQUEST_REFUND_RECEIVED:
      'PIX_PAYMENTS.pixInfraction.event.requestRefundReceived',
    ERROR: 'PIX_PAYMENTS.pixInfraction.event.error',
    CANCEL_PENDING_RECEIVED:
      'PIX_PAYMENTS.pixInfraction.event.cancelPendingReceived',
    CANCEL_CONFIRMED_RECEIVED:
      'PIX_PAYMENTS.pixInfraction.event.cancelConfirmedReceived',
    RECEIVE: 'PIX_PAYMENTS.pixInfraction.event.receive',
    ACKNOWLEDGE: 'PIX_PAYMENTS.pixInfraction.event.acknowledge',
    CANCEL_RECEIVED: 'PIX_PAYMENTS.pixInfraction.event.cancelReceived',
    CLOSE_RECEIVED: 'PIX_PAYMENTS.pixInfraction.event.closeReceived',
  },
  PIX_REFUND: {
    RECEIVE_PENDING: 'PIX_PAYMENTS.pixRefund.event.receivePending',
    RECEIVE_CONFIRMED: 'PIX_PAYMENTS.pixRefund.event.receiveConfirmed',
    CLOSED_PENDING: 'PIX_PAYMENTS.pixRefund.event.closePending',
    CLOSED_CONFIRMED: 'PIX_PAYMENTS.pixRefund.event.closeConfirmed',
    CLOSED_WAITING: 'PIX_PAYMENTS.pixRefund.event.closeWaiting',
    CANCEL_PENDING: 'PIX_PAYMENTS.pixRefund.event.cancelPending',
    CANCEL_CONFIRMED: 'PIX_PAYMENTS.pixRefund.event.cancelConfirmed',
    REVERTED: 'PIX_PAYMENTS.pixRefund.event.reverted',
    ERROR: 'PIX_PAYMENTS.pixRefund.event.error',
    RECEIVE: 'PIX_PAYMENTS.pixRefund.event.receive',
  },
  QR_CODE_DYNAMIC: {
    PENDING: 'PIX_PAYMENTS.qrCodeDynamic.event.pending',
    ERROR: 'PIX_PAYMENTS.qrCodeDynamic.event.error',
    READY: 'PIX_PAYMENTS.qrCodeDynamic.event.ready',
  },
  WARNING_PIX_DEPOSIT: {
    CREATED: 'PIX_PAYMENTS.warningPixDeposit.event.created',
    APPROVED: 'PIX_PAYMENTS.warningPixDeposit.event.approved',
    REJECTED: 'PIX_PAYMENTS.warningPixDeposit.event.rejected',
  },
  WARNING_PIX_DEVOLUTION: {
    CREATED: 'PIX_PAYMENTS.warningPixDevolution.event.created',
    CONFIRMED: 'PIX_PAYMENTS.warningPixDevolution.event.confirmed',
    COMPLETED: 'PIX_PAYMENTS.warningPixDevolution.event.completed',
    REVERTED: 'PIX_PAYMENTS.warningPixDevolution.event.reverted',
    PENDING: 'PIX_PAYMENTS.warningPixDevolution.event.pending',
    FAILED: 'PIX_PAYMENTS.warningPixDevolution.event.failed',
    WAITING: 'PIX_PAYMENTS.warningPixDevolution.event.waiting',
  },
  PIX_FRAUD_DETECTION: {
    RECEIVED: 'PIX_PAYMENTS.pixFraudDetection.event.received',
    RECEIVED_PENDING: 'PIX_PAYMENTS.pixFraudDetection.event.receivedPending',
    RECEIVED_CONFIRMED:
      'PIX_PAYMENTS.pixFraudDetection.event.receivedConfirmed',
    REGISTERED: 'PIX_PAYMENTS.pixFraudDetection.event.registered',
    REGISTERED_PENDING:
      'PIX_PAYMENTS.pixFraudDetection.event.registeredPending',
    REGISTERED_CONFIRMED:
      'PIX_PAYMENTS.pixFraudDetection.event.registeredConfirmed',
    CANCELED_RECEIVED: 'PIX_PAYMENTS.pixFraudDetection.event.canceledReceived',
    CANCELED_RECEIVED_PENDING:
      'PIX_PAYMENTS.pixFraudDetection.event.canceledReceivedPending',
    CANCELED_RECEIVED_CONFIRMED:
      'PIX_PAYMENTS.pixFraudDetection.event.canceledReceivedConfirmed',
    CANCELED_REGISTERED:
      'PIX_PAYMENTS.pixFraudDetection.event.canceledRegistered',
    CANCELED_REGISTERED_PENDING:
      'PIX_PAYMENTS.pixFraudDetection.event.canceledRegisteredPending',
    CANCELED_REGISTERED_CONFIRMED:
      'PIX_PAYMENTS.pixFraudDetection.event.canceledRegisteredConfirmed',
    FAILED: 'PIX_PAYMENTS.pixFraudDetection.event.failed',
  },
};

export const KAFKA_HUB = {
  QR_CODE_STATIC: {
    PENDING: {
      TOPAZIO_GATEWAY: 'PIX_PAYMENTS.qrCodeStatic.pending.observer.topazio',
      DEAD_LETTER: 'PIX_PAYMENTS.qrCodeStatic.pending.observer.deadLetter',
    },
    DELETING: {
      TOPAZIO_GATEWAY: 'PIX_PAYMENTS.qrCodeStatic.deleting.observer.topazio',
      DEAD_LETTER: 'PIX_PAYMENTS.qrCodeStatic.deleting.observer.deadLetter',
    },
  },
  QR_CODE_DYNAMIC: {
    PENDING: {
      TOPAZIO_GATEWAY: 'PIX_PAYMENTS.qrCodeDynamic.pending.observer.topazio',
      DEAD_LETTER: 'PIX_PAYMENTS.qrCodeDynamic.pending.observer.deadLetter',
    },
  },
  PAYMENT: {
    PENDING: {
      TOPAZIO_GATEWAY: 'PIX_PAYMENTS.payment.pending.observer.topazio',
    },
  },
  QR_CODE: {
    PENDING: {
      TOPAZIO_GATEWAY: 'PIX_PAYMENTS.decodedQrCode.pending.observer.topazio',
      DEAD_LETTER: 'PIX_PAYMENTS.decodedQrCode.pending.observer.deadLetter',
    },
  },
  PIX_DEVOLUTION: {
    PENDING: {
      TOPAZIO_GATEWAY: 'PIX_PAYMENTS.pixDevolution.pending.observer.topazio',
    },
    PENDING_FAILED: {
      TOPAZIO_GATEWAY:
        'PIX_PAYMENTS.pixDevolution.pendingFailed.observer.topazio',
    },
  },
  PIX_REFUND_DEVOLUTION: {
    PENDING: {
      TOPAZIO_GATEWAY:
        'PIX_PAYMENTS.pixRefundDevolution.pending.observer.topazio',
    },
  },
  WARNING_PIX_DEVOLUTION: {
    PENDING: {
      TOPAZIO_GATEWAY:
        'PIX_PAYMENTS.warningPixDevolution.pending.observer.topazio',
    },
  },
};
