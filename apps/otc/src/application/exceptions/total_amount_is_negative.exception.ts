import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'TOTAL_AMOUNT_IS_NEGATIVE')
export class TotalAmountIsNegativeException extends DefaultException {
  constructor(totalAmount: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'TOTAL_AMOUNT_IS_NEGATIVE',
      data: totalAmount,
    });
  }
}
