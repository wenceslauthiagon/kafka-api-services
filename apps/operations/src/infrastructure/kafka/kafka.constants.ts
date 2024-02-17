export const KAFKA_TOPICS = {
  WALLET: {
    CREATE_ACTIVE: 'OPERATIONS.wallet.createActive',
    UPDATE_BY_UUID_AND_USER: 'OPERATIONS.wallet.updateByUuidAndUser',
    DELETE_BY_UUID_AND_USER: 'OPERATIONS.wallet.deleteByUuidAndUser',
    GET_BY_UUID: 'OPERATIONS.wallet.getByUuid',
    GET_BY_USER_AND_DEFAULT_IS_TRUE:
      'OPERATIONS.wallet.getByUserAndDefaultIsTrue',
    GET_ALL_BY_USER: 'OPERATIONS.wallet.getAllByUser',
  },
  WALLET_ACCOUNT: {
    GET_ALL: 'OPERATIONS.walletAccount.getAll',
    CREATE: 'OPERATIONS.walletAccount.create',
    GET_BY_USER_AND_CURRENCY: 'OPERATIONS.walletAccount.getByUserAndCurrency',
    GET_BY_WALLET_AND_CURRENCY:
      'OPERATIONS.walletAccount.getByWalletAndCurrency',
    GET_BY_ACCOUNT_NUMBER_AND_CURRENCY:
      'OPERATIONS.walletAccount.getByAccountNumberAndCurrency',
    GET_BY_WALLET_AND_UUID: 'OPERATIONS.walletAccount.getByWalletAndUuid',
  },
  OPERATION: {
    CREATE: 'OPERATIONS.operation.create',
    ACCEPT: 'OPERATIONS.operation.accept',
    CREATE_AND_ACCEPT: 'OPERATIONS.operation.createAndAccept',
    REVERT: 'OPERATIONS.operation.revert',
    GET_BY_ID: 'OPERATIONS.operation.getById',
    SET_REFERENCE_BY_ID: 'OPERATIONS.operation.setReferenceById',
    GET_ALL_BY_USER_AND_WALLET_AND_FILTER:
      'OPERATIONS.operation.getAllByUserAndWalletAndFilter',
    GET_BY_USER_AND_WALLET_AND_ID:
      'OPERATIONS.operation.getByUserAndWalletAndId',
    GET_RECEIPT_BY_USER_AND_WALLET_AND_ID:
      'OPERATIONS.operation.getReceiptByUserAndWalletAndId',
    GET_ALL_BY_FILTER: 'OPERATIONS.operation.getAllByFilter',
    GET_STATEMENT: 'OPERATIONS.operation.getStatement',
  },
  TRANSACTION_TYPE: {
    GET_BY_ID: 'OPERATIONS.transactionType.getById',
    GET_ACTIVE_BY_TAG: 'OPERATIONS.transactionType.getActiveByTag',
  },
  CURRENCY: {
    CREATE: 'OPERATIONS.currency.create',
    GET_BY_SYMBOL: 'OPERATIONS.currency.getBySymbol',
    GET_BY_TAG: 'OPERATIONS.currency.getByTag',
    GET_BY_ID: 'OPERATIONS.currency.getById',
    GET_ALL: 'OPERATIONS.currency.getAll',
  },
  USER_LIMIT: {
    GET_BY_ID: 'OPERATIONS.userLimit.getById',
    UPDATE: 'OPERATIONS.userLimit.update',
    UPDATE_BY_ADMIN: 'OPERATIONS.userLimit.updateByAdmin',
    GET_BY_FILTER: 'OPERATIONS.userLimit.getByFilter',
  },
  LIMIT_TYPE: {
    GET_BY_FILTER: 'OPERATIONS.limitType.getByFilter',
  },
  P2P_TRANSFER: {
    CREATE: 'OPERATIONS.p2pTransfer.create',
  },
  USER_WALLET: {
    GET_ALL_BY_USER: 'OPERATIONS.userWallet.getAllByUser',
    CREATE: 'OPERATIONS.userWallet.create',
    GET_BY_USER_AND_WALLET: 'OPERATIONS.userWallet.getByUserAndWallet',
    DELETE_BY_WALLET: 'OPERATIONS.userWallet.deleteByWallet',
    DELETE_BY_USER_AND_WALLET: 'OPERATIONS.userWallet.deleteByUserAndWallet',
    UPDATE_BY_WALLET: 'OPERATIONS.userWallet.updateByWallet',
    GET_ALL_BY_USER_AND_WALLET: 'OPERATIONS.userWallet.getAllByUserAndWallet',
  },
  WALLET_INVITATION: {
    GET_ALL_BY_USER: 'OPERATIONS.walletInvitation.getAllByUser',
    GET_ALL_BY_EMAIL: 'OPERATIONS.walletInvitation.getAllByEmail',
    CREATE: 'OPERATIONS.walletInvitation.create',
    ACCEPT: 'OPERATIONS.walletInvitation.accept',
    DECLINE: 'OPERATIONS.walletInvitation.decline',
    CANCEL: 'OPERATIONS.walletInvitation.cancel',
    SEND_NOTIFICATION: 'OPERATIONS.walletInvitation.sendNotification',
  },
  PERMISSION_ACTION: {
    GET_ALL_BY_PERMISSION_TYPES:
      'OPERATIONS.permissionAction.getAllByPermissionTypes',
  },
};

export const KAFKA_EVENTS = {
  USER_LIMIT: {
    UPDATED: 'OPERATIONS.userLimit.event.updated',
    CREATED: 'OPERATIONS.userLimit.event.created',
  },
  OPERATION: {
    PENDING: 'OPERATIONS.operation.event.pending',
    ACCEPTED: 'OPERATIONS.operation.event.accepted',
    REVERTED: 'OPERATIONS.operation.event.reverted',
  },
};

export const KAFKA_HUB = {};
