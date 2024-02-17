import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'MERCADO_BITCOIN_AUTH')
export class MercadoBitcoinAuthException extends DefaultException {
  constructor(error?: Error) {
    super({
      message: 'Mercado Bitcoin auth error',
      type: ExceptionTypes.SYSTEM,
      code: 'MERCADO_BITCOIN_AUTH',
      data: error,
    });
  }
}
