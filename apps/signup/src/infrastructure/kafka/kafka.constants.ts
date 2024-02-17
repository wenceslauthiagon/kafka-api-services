export const KAFKA_TOPICS = {
  SIGNUP: {
    CREATE: 'SIGNUP.signup.create',
    UPDATE: 'SIGNUP.signup.update',
    SEND_CONFIRM_CODE: 'SIGNUP.signup.sendConfirmCode',
    VERIFY_CONFIRM_CODE: 'SIGNUP.signup.verifyConfirmCode',
    GET_BY_ID: 'SIGNUP.signup.getById',
  },
};

export const KAFKA_EVENTS = {
  SIGNUP: {
    PENDING: 'SIGNUP.signup.event.pending',
    CONFIRMED: 'SIGNUP.signup.event.confirmed',
    NOT_CONFIRMED: 'SIGNUP.signup.event.notConfirmed',
    READY: 'SIGNUP.signup.event.ready',
    DUPLICATED: 'SIGNUP.signup.event.duplicated',
    BLOCK_LIST: 'SIGNUP.signup.event.blockList',
    EXPIRED: 'SIGNUP.signup.event.expired',
  },
};

export const KAFKA_HUB = {};
