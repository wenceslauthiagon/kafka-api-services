export const KAFKA_TOPICS = {
  BOT_OTC_ORDER: {
    UPDATE_BY_REMITTANCE: 'OTC_BOT.botOtcOrder.updateByRemittance',
    GET_BY_ID: 'OTC_BOT.botOtcOrder.getById',
    GET_ALL_BY_FILTER: 'OTC_BOT.botOtcOrder.getAllByFilter',
  },
  BOT_OTC: {
    GET_ANALYSIS: 'OTC_BOT.botOtc.getAnalysis',
    UPDATE: 'OTC_BOT.botOtc.update',
  },
};

export const KAFKA_EVENTS = {
  BOT_OTC_ORDER: {
    PENDING: 'OTC_BOT.botOtcOrder.event.pending',
    SOLD: 'OTC_BOT.botOtcOrder.event.sold',
    ERROR: 'OTC_BOT.botOtcOrder.event.error',
    FILLED: 'OTC_BOT.botOtcOrder.event.filled',
    COMPLETED: 'OTC_BOT.botOtcOrder.event.completed',
    COMPLETED_WITH_REMITTANCE:
      'OTC_BOT.botOtcOrder.event.completedWithRemittance',
  },
};

export const KAFKA_HUB = {};
