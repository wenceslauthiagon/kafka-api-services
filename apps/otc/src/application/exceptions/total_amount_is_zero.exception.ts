import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'TOTAL_AMOUNT_IS_ZERO')
export class TotalAmountIsZeroException extends DefaultException {
  constructor(totalAmount: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'TOTAL_AMOUNT_IS_ZERO',
      data: totalAmount,
    });
  }
}
