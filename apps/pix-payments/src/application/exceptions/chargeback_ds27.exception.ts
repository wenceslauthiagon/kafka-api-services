import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CHARGEBACK_DS27')
export class ChargebackDS27Exception extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'CHARGEBACK_DS27',
      data,
    });
  }
}
