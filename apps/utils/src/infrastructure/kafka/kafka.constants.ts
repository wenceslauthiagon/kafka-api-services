export const KAFKA_TOPICS = {
  USER_WITHDRAW_SETTING: {
    CREATE: 'UTILS.userWithdrawSetting.create',
    GET_ALL: 'UTILS.userWithdrawSetting.getAll',
    DELETE: 'UTILS.userWithdrawSetting.delete',
  },
  FEATURE_SETTING: {
    GET_BY_NAME: 'UTILS.featureSetting.getByName',
    UPDATE_STATE: 'UTILS.featureSetting.updateState',
  },
};

export const KAFKA_EVENTS = {
  RETRY: {
    PUSH: 'UTILS.retry.event.push',
    READY: 'UTILS.ready.event.ready',
  },
  USER_WITHDRAW_SETTING: {
    CREATED: 'UTILS.userWithdrawSetting.event.created',
  },
  FEATURE_SETTING: {
    UPDATE_CREATE_EXCHANGE_QUOTATION:
      'UTILS.featureSetting.createExchangeQuotation',
  },
};

export const KAFKA_HUB = {};
