export const KAFKA_TOPICS = {
  QUOTATION: {
    GET_CURRENT: 'QUOTATIONS.quotation.getCurrent',
    GET_CURRENT_BY_ID: 'QUOTATIONS.quotation.getCurrentById',
    GET_BY_ID: 'QUOTATIONS.quotation.getById',
    CREATE: 'QUOTATIONS.quotation.create',
  },
  STREAM_QUOTATION: {
    GET_BY_BASE_CURRENCY: 'QUOTATIONS.streamQuotation.getByBaseCurrency',
    GET_BY_BASE_AND_QUOTE_AND_GATEWAY_NAME:
      'QUOTATIONS.streamQuotation.getByBaseAndQuoteAndGatewayName',
    GET_TREND_DAY_BY_BASE_CURRENCY:
      'QUOTATIONS.streamQuotation.getTrendDayByBaseCurrency',
  },
  STREAM_PAIR: {
    GET_ALL: 'QUOTATIONS.streamPair.getAll',
    GET_BY_ID: 'QUOTATIONS.streamPair.getById',
  },
  QUOTATION_TREND: {
    GET_TRENDS_BY_WINDOW_AND_RESOLUTION_AND_BASE_CURRENCIES:
      'QUOTATIONS.quotationtrend.getTrendByWindowAndResolutionAndBaseCurrencies',
  },
  TAX: {
    GET_ALL: 'QUOTATIONS.tax.getAll',
  },
  HOLIDAY: {
    GET_BY_DATE: 'QUOTATIONS.holiday.getByDate',
    CREATE: 'QUOTATIONS.holiday.create',
    UPDATE_BY_ID: 'QUOTATIONS.holiday.updateById',
  },
};

export const KAFKA_EVENTS = {
  QUOTATION: {
    CREATED: 'QUOTATIONS.quotation.event.created',
  },
  STREAM_QUOTATION: {
    CREATED: 'QUOTATIONS.streamQuotation.event.created',
  },
};

export const KAFKA_HUB = {};
