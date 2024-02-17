import {
  GatewayException,
  ExceptionTypes,
  IException,
  Exception,
} from '@zro/common';

@Exception(ExceptionTypes.SYSTEM, 'HISTORICAL_CRYPTO_PRICE_GATEWAY_ERROR')
export class HistoricalCryptoPriceGatewayException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'HISTORICAL_CRYPTO_PRICE_GATEWAY_ERROR',
      data: error?.data ?? error,
    });
  }
}

@Exception(ExceptionTypes.SYSTEM, 'HISTORICAL_CRYPTO_PRICE_GATEWAY_OFFLINE')
export class OfflineHistoricalCryptoPriceGatewayException extends HistoricalCryptoPriceGatewayException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'HISTORICAL_CRYPTO_PRICE_GATEWAY_OFFLINE',
      data: error,
    });
  }
}

@Exception(ExceptionTypes.SYSTEM, 'HISTORICAL_CRYPTO_PRICE_GATEWAY_NOT_FOUND')
export class NotFoundHistoricalCryptoPriceGatewayException extends HistoricalCryptoPriceGatewayException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'HISTORICAL_CRYPTO_PRICE_GATEWAY_NOT_FOUND',
      data: error,
    });
  }
}
