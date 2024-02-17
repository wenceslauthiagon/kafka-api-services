import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class ExchangeQuotationPspException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'PSP_ERROR',
      data: error?.data ?? error,
    });
  }
}

export class OfflineExchangeQuotationPspException extends ExchangeQuotationPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PSP_OFFLINE',
      data: error,
    });
  }
}

export class ExchangeQuotationNotFoundPspException extends ExchangeQuotationPspException {
  constructor(error?: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PSP_TRADE_NOT_FOUND',
      data: error,
    });
  }
}
