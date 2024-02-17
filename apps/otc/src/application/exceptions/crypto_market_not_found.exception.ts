import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { StreamQuotation } from '@zro/quotations/domain';

@Exception(ExceptionTypes.USER, 'CRYPTO_MARKET_NOT_FOUND')
export class CryptoMarketNotFoundException extends DefaultException {
  constructor(
    streamQuotation: Pick<
      StreamQuotation,
      'baseCurrency' | 'quoteCurrency' | 'gatewayName'
    >,
  ) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_MARKET_NOT_FOUND',
      data: streamQuotation,
    });
  }
}
