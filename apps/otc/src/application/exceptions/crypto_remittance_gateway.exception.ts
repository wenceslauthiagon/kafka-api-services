import {
  GatewayException,
  ExceptionTypes,
  IException,
  Exception,
} from '@zro/common';
import { CryptoMarket, OrderSide, OrderType } from '@zro/otc/domain';

@Exception(ExceptionTypes.SYSTEM, 'CRYPTO_REMITTANCE_GATEWAY_ERROR')
export class CryptoRemittanceGatewayException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'CRYPTO_REMITTANCE_GATEWAY_ERROR',
      data: error?.data ?? error,
    });
  }
}

@Exception(ExceptionTypes.SYSTEM, 'CRYPTO_REMITTANCE_GATEWAY_OFFLINE')
export class OfflineCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_OFFLINE',
      data: error,
    });
  }
}

@Exception(ExceptionTypes.SYSTEM, 'CRYPTO_REMITTANCE_GATEWAY_ORDER_NOT_PLACED')
export class OrderNotPlacedCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data?: any) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_NOT_PLACED',
      data,
    });
  }
}

@Exception(ExceptionTypes.SYSTEM, 'CRYPTO_REMITTANCE_GATEWAY_ORDER_NOT_DELETED')
export class OrderNotDeletedCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data?: any) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_NOT_DELETED',
      data,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_PAIR_NOT_SUPPORTED',
)
export class PairNotSupportedCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(market: CryptoMarket) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_PAIR_NOT_SUPPORTED',
      data: market,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_AMOUNT_NOT_SUPPORTED',
)
export class OrderAmountNotSupportedCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data: Partial<any>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_AMOUNT_NOT_SUPPORTED',
      data,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_AMOUNT_OVERFLOW',
)
export class OrderAmountOverflowCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data: Partial<any>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_AMOUNT_OVERFLOW',
      data,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_AMOUNT_UNDERFLOW',
)
export class OrderAmountUnderflowCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data: Partial<any>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_AMOUNT_UNDERFLOW',
      data,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_INVALID_STOP_PRICE',
)
export class OrderInvalidStopPriceCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data: Partial<any>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_INVALID_STOP_PRICE',
      data,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_INVALID_UNTIL_DATE',
)
export class OrderInvalidUntilDateCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data: Partial<any>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_INVALID_UNTIL_DATE',
      data,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_PRICE_NOT_SUPPORTED',
)
export class OrderPriceNotSupportedCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data: Partial<any>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_PRICE_NOT_SUPPORTED',
      data,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_PRICE_UNDERFLOW',
)
export class OrderPriceUnderflowCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data: Partial<any>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_PRICE_UNDERFLOW',
      data,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_SIDE_NOT_SUPPORTED',
)
export class OrderSideNotSupportedCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(side: OrderSide) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_SIDE_NOT_SUPPORTED',
      data: side,
    });
  }
}

@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_TYPE_NOT_SUPPORTED',
)
export class OrderTypeNotSupportedCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(type: OrderType) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_TYPE_NOT_SUPPORTED',
      data: type,
    });
  }
}
@Exception(
  ExceptionTypes.SYSTEM,
  'CRYPTO_REMITTANCE_GATEWAY_ORDER_INVALID_UNTIL_DATE',
)
export class OrderInvalidUntilDateExceptionCryptoRemittanceGatewayException extends CryptoRemittanceGatewayException {
  constructor(data: Partial<any>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CRYPTO_REMITTANCE_GATEWAY_ORDER_INVALID_UNTIL_DATE',
      data,
    });
  }
}
