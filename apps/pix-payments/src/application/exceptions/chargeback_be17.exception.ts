import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CHARGEBACK_BE17')
export class ChargebackBE17Exception extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'CHARGEBACK_BE17',
      data,
    });
  }
}
