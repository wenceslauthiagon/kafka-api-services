import { buildQueryString } from '@zro/common';

export const BINANCE_ERROR_CODE = -1000;

export const BINANCE_PROVIDER_NAME = 'BINANCE';

export const BINANCE_CACHE = {
  MARKETS: `${BINANCE_PROVIDER_NAME}-markets`,
};

export const BINANCE_SERVICES = {
  MARKETS: (params = {}): string => {
    return buildQueryString('/api/v3/exchangeInfo', params);
  },
  ORDERS: (params = {}): string => {
    return buildQueryString('/api/v3/order', params);
  },
};
