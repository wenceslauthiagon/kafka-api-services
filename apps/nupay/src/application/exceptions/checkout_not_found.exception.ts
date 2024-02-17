import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Checkout } from '@zro/nupay/domain';

@Exception(ExceptionTypes.USER, 'CHECKOUT_NOT_FOUND')
export class CheckoutNotFoundException extends DefaultException {
  constructor(data: Partial<Checkout>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CHECKOUT_NOT_FOUND',
      data,
    });
  }
}
