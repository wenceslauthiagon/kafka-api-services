export const B2C2_PROVIDER_NAME = 'B2C2';

export const B2C2_CACHE = {
  MARKETS: `${B2C2_PROVIDER_NAME}-markets`,
};

export const B2C2_SERVICES = {
  ACCOUNT_INFO: 'account_info',
  BALANCE: 'balance',
  CURRENCIES: 'currency',
  INSTRUMENTS: 'instruments',
  LEDGER: 'ledger',
  ORDER: 'order/',
  REQUEST_FOR_QUOTE: 'request_for_quote',
  TRADE: 'trade',
};

export const B2C2_MAP_CURRENCY_SYMBOLS = {
  USDT: 'UST',
  USDC: 'USC',
  UST: 'USDT',
  USC: 'USDC',
};

export function b2c2Currency(symbol: string) {
  return B2C2_MAP_CURRENCY_SYMBOLS[symbol] ?? symbol;
}
