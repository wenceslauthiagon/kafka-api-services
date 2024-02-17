export const MERCADO_BITCOIN_PROVIDER_NAME = 'MERCADO_BITCOIN';

export const MERCADO_BITCOIN_CACHE = {
  MARKETS: `${MERCADO_BITCOIN_PROVIDER_NAME}-markets`,
};

export const MERCADO_BITCOIN_SERVICES = {
  AUTHORIZE: 'authorize',
  SYMBOLS: 'symbols',
  ORDER: (account: string, symbol: string) =>
    `/accounts/${account}/${symbol}/orders/`,
};
