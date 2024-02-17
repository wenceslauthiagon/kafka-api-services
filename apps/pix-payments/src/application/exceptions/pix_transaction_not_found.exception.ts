import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixInfractionTransaction } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_TRANSACTION_NOT_FOUND')
export class PixTransactionNotFoundException extends DefaultException {
  constructor(data: Partial<PixInfractionTransaction>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_TRANSACTION_NOT_FOUND',
      data,
    });
  }
}
