import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Checkout } from '@zro/nupay/domain';

@Exception(ExceptionTypes.USER, 'CHECKOUT_INVALID_STATE')
export class CheckoutInvalidStateException extends DefaultException {
  constructor(data: Partial<Checkout>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CHECKOUT_INVALID_STATE',
      data,
    });
  }
}
