import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CONVERSION_CREDIT_BALANCE_OVERFLOW')
export class ConversionCreditBalanceOverflowException extends DefaultException {
  constructor(liability: number, creditBalance: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'CONVERSION_CREDIT_BALANCE_OVERFLOW',
      data: { liability, creditBalance },
    });
  }
}
