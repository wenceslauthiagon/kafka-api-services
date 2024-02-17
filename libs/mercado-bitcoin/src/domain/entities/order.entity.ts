import { CryptoRemittanceStatus } from '@zro/otc/domain';

export enum MercadoBitcoinOrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum MercadoBitcoinOrderType {
  MARKET = 'market',
  LIMIT = 'limit',
}

export enum MercadoBitcoinOrderStatus {
  PENDING = 'pending',
  WORKING = 'working',
  CANCELLED = 'cancelled',
  FILLED = 'filled',
}

export const MercadoBitcoinOrderStatusMap = {
  [MercadoBitcoinOrderStatus.CANCELLED]: CryptoRemittanceStatus.CANCELED,
  [MercadoBitcoinOrderStatus.FILLED]: CryptoRemittanceStatus.FILLED,
  [MercadoBitcoinOrderStatus.PENDING]: CryptoRemittanceStatus.PENDING,
  [MercadoBitcoinOrderStatus.WORKING]: CryptoRemittanceStatus.WAITING,
};
