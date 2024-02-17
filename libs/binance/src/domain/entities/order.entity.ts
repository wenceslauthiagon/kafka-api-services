import { CryptoRemittanceStatus } from '@zro/otc/domain';

export enum BinanceOrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum BinanceOrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
  STOP_LOSS = 'STOP_LOSS',
  STOP_LOSS_LIMIT = 'STOP_LOSS_LIMIT',
  TAKE_PROFIT = 'TAKE_PROFIT',
  TAKE_PROFIT_LIMIT = 'TAKE_PROFIT_LIMIT',
  LIMIT_MAKER = 'LIMIT_MAKER',
}

export enum BinanceOrderStatus {
  NEW = 'NEW',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum BinanceOrderRespType {
  ACK = 'ACK',
  RESULT = 'RESULT',
  FULL = 'FULL',
}

export enum BinanceTimeInForce {
  GTC = 'GTC',
  IOC = 'IOC',
  FOK = 'FOK',
}

export function binanceOrderStatusMap(status: BinanceOrderStatus) {
  switch (status) {
    case BinanceOrderStatus.NEW:
      return CryptoRemittanceStatus.PENDING;
    case BinanceOrderStatus.PARTIALLY_FILLED:
      return CryptoRemittanceStatus.WAITING;
    case BinanceOrderStatus.FILLED:
      return CryptoRemittanceStatus.FILLED;
    case BinanceOrderStatus.CANCELED:
      return CryptoRemittanceStatus.CANCELED;
    case BinanceOrderStatus.REJECTED:
      return CryptoRemittanceStatus.CANCELED;
    case BinanceOrderStatus.EXPIRED:
      return CryptoRemittanceStatus.CANCELED;
  }
}
