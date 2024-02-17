export const KAFKA_TOPICS = {
  ONBOARDING: {
    CREATE: 'USERS.onboarding.create',
    GET_BY_USER_AND_STATUS_IS_FINISHED:
      'USERS.onboarding.getByUserAndStatusIsFinished',
    GET_BY_ACCOUNT_NUMBER_AND_STATUS_IS_FINISHED:
      'USERS.onboarding.getByAccountNumberAndStatusIsFinished',
    GET_ADDRESS_BY_USER_AND_STATUS_IS_FINISHED:
      'USERS.onboarding.getAddressByUserAndStatusIsFinished',
    GET_BY_DOCUMENT_AND_STATUS_IS_FINISHED:
      'USERS.onboarding.getAddressByDocumentAndStatusIsFinished',
  },
  ADDRESS: {
    GET_BY_ID: 'USERS.address.getById',
  },
  USER: {
    GET_BY_UUID: 'USERS.user.getByUuid',
    GET_BY_DOCUMENT: 'USERS.user.getByDocument',
    GET_BY_PHONE_NUMBER: 'USERS.user.getByPhoneNumber',
    GET_BY_EMAIL: 'USERS.user.getByEmail',
    UPDATE_USER_PROPS: 'USERS.user.updateUserProps',
    CREATE: 'USERS.user.create',
    SEND_CODE: 'USERS.user.sendCode',
    CHANGE_PASSWORD: 'USERS.user.changePassword',
    GET_BY_ID: 'USERS.user.getById',
    GET_USER_HAS_PIN: 'USERS.user.getHasPin',
    UPDATE_USER_PIN: 'USERS.user.updateUserPin',
    ADD_USER_PIN: 'USERS.user.addUserPin',
    UPDATE_USER_PIN_HAS_CREATED: 'USERS.user.updateUserPinHasCreated',
  },
  USER_PIN_ATTEMPTS: {
    GET_BY_USER: 'USERS.userPinAttempts.getByUser',
    UPDATE: 'USERS.userPinAttempts.update',
  },
  USER_API_KEY: {
    GET_BY_ID: 'USERS.userApiKey.getById',
    GET_BY_USER: 'USERS.userApiKey.getByUser',
  },
  USER_FORGOT_PASSWORD: {
    CREATE_BY_SMS: 'USERS.userForgotPassword.createBySms',
    CREATE_BY_EMAIL: 'USERS.userForgotPassword.createByEmail',
    DECLINE: 'USERS.userForgotPassword.decline',
    UPDATE: 'USERS.userForgotPassword.update',
  },
};

export const KAFKA_EVENTS = {
  USER_PIN_ATTEMPTS: {
    UPDATED: 'USERS.userPinAttempts.event.error',
  },
  USER: {
    PENDING: 'USERS.user.event.pending',
    UPDATE_PIN: 'USERS.user.event.updatePin',
    ADD_PIN: 'USERS.user.event.addPin',
  },
  USER_FORGOT_PASSWORD: {
    CREATED: 'USERS.userForgotPassword.event.created',
    CONFIRMED: 'USERS.userForgotPassword.event.confirmed',
    DECLINED: 'USERS.userForgotPassword.event.declined',
    EXPIRED: 'USERS.userForgotPassword.event.expired',
  },
};

export const KAFKA_HUB = {};
