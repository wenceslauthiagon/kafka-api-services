export const KAFKA_TOPICS = {
  KEY: {
    CREATE: 'PIX_KEYS.key.create',
    GET_ALL: 'PIX_KEYS.key.getAll',
    GET_ALL_BY_USER: 'PIX_KEYS.key.getAllByUser',
    GET_BY_ID: 'PIX_KEYS.key.getById',
    GET_BY_KEY: 'PIX_KEYS.key.getByKey',
    GET_BY_KEY_AND_USER: 'PIX_KEYS.key.getByKeyAndUser',
    DELETE_BY_ID: 'PIX_KEYS.key.deleteById',
    DISMISS_BY_ID: 'PIX_KEYS.key.dismissById',
    CANCEL_START_CLAIM_PROCESS_BY_ID:
      'PIX_KEYS.key.cancelStartClaimProcessById',
    CANCEL_START_PORTABILITY_PROCESS_BY_ID:
      'PIX_KEYS.key.cancelStartPortabilityProcessById',
    SEND_CODE: 'PIX_KEYS.key.sendCode',
    VERIFY_CODE: 'PIX_KEYS.key.verifyCode',
    START_OWNERSHIP_PROCESS: 'PIX_KEYS.key.startOwnershipProcess',
    START_PORTABILITY_PROCESS: 'PIX_KEYS.key.startPortabilityProcess',
    CANCEL_PORTABILITY_REQUEST_PROCESS:
      'PIX_KEYS.key.cancelPortabilityRequestProcess',
    APPROVE_PORTABILITY_PROCESS: 'PIX_KEYS.key.approvePortabilityProcess',
    CANCEL_PORTABILITY_PROCESS: 'PIX_KEYS.key.cancelPortabilityProcess',
    CANCELING_PORTABILITY_PROCESS: 'PIX_KEYS.key.cancelingPortabilityProcess',
    COMPLETE_PORTABILITY_PROCESS: 'PIX_KEYS.key.completePortabilityProcess',
    CONFIRM_PORTABILITY_PROCESS: 'PIX_KEYS.key.confirmPortabilityProcess',
    READY_PORTABILITY_PROCESS: 'PIX_KEYS.key.readyPortabilityProcess',
    WAIT_OWNERSHIP_PROCESS: 'PIX_KEYS.key.waitOwnershipProcess',
    WAIT_PORTABILITY_PROCESS: 'PIX_KEYS.key.waitPortabilityProcess',
    COMPLETE_OWNERSHIP_PROCESS: 'PIX_KEYS.key.completeOwnershipProcess',
    CANCEL_OWNERSHIP_PROCESS: 'PIX_KEYS.key.cancelOwnershipProcess',
    CANCELING_OWNERSHIP_PROCESS: 'PIX_KEYS.key.cancelingOwnershipProcess',
    CONFIRM_OWNERSHIP_PROCESS: 'PIX_KEYS.key.confirmOwnershipProcess',
    READY_OWNERSHIP_PROCESS: 'PIX_KEYS.key.readyOwnershipProcess',
    COMPLETE_CLAIM_CLOSING: 'PIX_KEYS.key.completeClaimClosing',
    CANCEL_CODE: 'PIX_KEYS.key.cancelCode',
    GET_BY_DECODED_PIX_KEY_ID: 'PIX_KEYS.key.getByDecodedPixKeyId',
  },
  DECODED_KEY: {
    CREATE: 'PIX_KEYS.decodedKey.create',
    GET_BY_ID: 'PIX_KEYS.decodedKey.getById',
    UPDATE_STATE_BY_ID: 'PIX_KEYS.decodedKey.updateStateById',
  },
  KEY_HISTORY: {
    GET_ALL: 'PIX_KEYS.keyHistory.getAll',
  },
};

export const KAFKA_EVENTS = {
  KEY: {
    ERROR: 'PIX_KEYS.key.event.error',
    ADD_FAILED: 'PIX_KEYS.key.event.addFailed',
    READY: 'PIX_KEYS.key.event.ready',
    ADD_READY: 'PIX_KEYS.key.event.addReady',
    DELETED: 'PIX_KEYS.key.event.deleted',
    DELETING: 'PIX_KEYS.key.event.deleting',
    PENDING: 'PIX_KEYS.key.event.pending',
    PENDING_EXPIRED: 'PIX_KEYS.key.event.pendingExpired',
    CANCELED: 'PIX_KEYS.key.event.canceled',
    CONFIRMED: 'PIX_KEYS.key.event.confirmed',
    CLAIM_PENDING: 'PIX_KEYS.key.event.claimPending',
    CLAIM_PENDING_EXPIRED: 'PIX_KEYS.key.event.claimPendingExpired',
    CLAIM_CLOSING: 'PIX_KEYS.key.event.claimClosing',
    CLAIM_CLOSED: 'PIX_KEYS.key.event.claimClosed',
    CLAIM_DENIED: 'PIX_KEYS.key.event.claimDenied',
    CLAIM_NOT_CONFIRMED: 'PIX_KEYS.key.event.claimNotConfirmed',
    PORTABILITY_PENDING: 'PIX_KEYS.key.event.portabilityPending',
    PORTABILITY_OPENED: 'PIX_KEYS.key.event.portabilityOpened',
    PORTABILITY_STARTED: 'PIX_KEYS.key.event.portabilityStarted',
    PORTABILITY_CONFIRMED: 'PIX_KEYS.key.event.portabilityConfirmed',
    PORTABILITY_CANCELING: 'PIX_KEYS.key.event.portabilityCanceling',
    PORTABILITY_CANCELED: 'PIX_KEYS.key.event.portabilityCanceled',
    PORTABILITY_READY: 'PIX_KEYS.key.event.portabilityReady',
    PORTABILITY_REQUEST_CANCEL_OPENED:
      'PIX_KEYS.key.event.portabilityRequestCancelOpened',
    PORTABILITY_REQUEST_CANCEL_STARTED:
      'PIX_KEYS.key.event.portabilityRequestCancelStarted',
    PORTABILITY_REQUEST_CONFIRM_OPENED:
      'PIX_KEYS.key.event.portabilityRequestConfirmOpened',
    PORTABILITY_REQUEST_CONFIRM_STARTED:
      'PIX_KEYS.key.event.portabilityRequestConfirmStarted',
    PORTABILITY_REQUEST_PENDING: 'PIX_KEYS.key.event.portabilityRequestPending',
    PORTABILITY_REQUEST_AUTO_CONFIRMED:
      'PIX_KEYS.key.event.portabilityRequestAutoConfirmed',
    PORTABILITY_PENDING_EXPIRED: 'PIX_KEYS.key.event.portabilityPendingExpired',
    OWNERSHIP_PENDING: 'PIX_KEYS.key.event.ownershipPending',
    OWNERSHIP_PENDING_EXPIRED: 'PIX_KEYS.key.event.ownershipPendingExpired',
    OWNERSHIP_OPENED: 'PIX_KEYS.key.event.ownershipOpened',
    OWNERSHIP_STARTED: 'PIX_KEYS.key.event.ownershipStarted',
    OWNERSHIP_WAITING: 'PIX_KEYS.key.event.ownershipWaiting',
    OWNERSHIP_CONFIRMED: 'PIX_KEYS.key.event.ownershipConfirmed',
    OWNERSHIP_CANCELING: 'PIX_KEYS.key.event.ownershipCanceling',
    OWNERSHIP_CANCELED: 'PIX_KEYS.key.event.ownershipCanceled',
    OWNERSHIP_READY: 'PIX_KEYS.key.event.ownershipReady',
    OWNERSHIP_CONFLICT: 'PIX_KEYS.key.event.ownershipConflict',
    STATE_HISTORY: 'PIX_KEYS.key.event.stateHistory',
  },
  DECODED_KEY: {
    DECODED: 'PIX_KEYS.decodedKey.event.decoded',
    ERROR: 'PIX_KEYS.decodedKey.event.error',
    PENDING: 'PIX_KEYS.decodedKey.event.pending',
    CONFIRMED: 'PIX_KEYS.decodedKey.event.confirmed',
  },
  PIX_KEY_CLAIM: {
    READY: 'PIX_KEYS.pixKeyClaim.event.ready',
    ERROR: 'PIX_KEYS.pixKeyClaim.event.error',
  },
};

export const KAFKA_HUB = {
  // TODO: Rename all TOPAZIO_GATEWAY to 'KEY_GATEWAY: PIX_KEYS.confirmed.observer.key'
  CONFIRMED: {
    TOPAZIO_GATEWAY: 'PIX_KEYS.confirmed.observer.topazio',
    DEAD_LETTER: 'PIX_KEYS.confirmed.observer.deadLetter',
  },
  DELETING: {
    TOPAZIO_GATEWAY: 'PIX_KEYS.deleted.observer.topazio',
    DEAD_LETTER: 'PIX_KEYS.deleted.observer.deadLetter',
  },
  OWNERSHIP_OPENED: {
    TOPAZIO_GATEWAY: 'PIX_KEYS.ownershipOpened.observer.topazio',
    DEAD_LETTER: 'PIX_KEYS.ownershipOpened.observer.deadLetter',
  },
  PORTABILITY_OPENED: {
    TOPAZIO_GATEWAY: 'PIX_KEYS.portabilityOpened.observer.topazio',
    DEAD_LETTER: 'PIX_KEYS.portabilityOpened.observer.deadLetter',
  },
  PORTABILITY_CONFIRM_OPENED: {
    TOPAZIO_GATEWAY: 'PIX_KEYS.portabilityConfirmOpened.observer.topazio',
    DEAD_LETTER: 'PIX_KEYS.portabilityConfirmOpened.observer.deadLetter',
  },
  PORTABILITY_CANCEL_OPENED: {
    TOPAZIO_GATEWAY: 'PIX_KEYS.portabilityCancelOpened.observer.topazio',
    DEAD_LETTER: 'PIX_KEYS.portabilityCancelOpened.observer.deadLetter',
  },
  CLAIM_CLOSING: {
    TOPAZIO_GATEWAY: 'PIX_KEYS.claimClosing.observer.topazio',
    DEAD_LETTER: 'PIX_KEYS.claimClosing.observer.deadLetter',
  },
  CLAIM_DENIED: {
    TOPAZIO_GATEWAY: 'PIX_KEYS.claimDenied.observer.topazio',
    DEAD_LETTER: 'PIX_KEYS.claimDenied.observer.deadLetter',
  },
  PORTABILITY_CANCELING: {
    KEY_GATEWAY: 'PIX_KEYS.portabilityCanceling.observer.key',
    DEAD_LETTER: 'PIX_KEYS.portabilityCanceling.observer.deadLetter',
  },
  OWNERSHIP_CANCELING: {
    KEY_GATEWAY: 'PIX_KEYS.ownershipCanceling.observer.key',
    DEAD_LETTER: 'PIX_KEYS.ownershipCanceling.observer.deadLetter',
  },
};
