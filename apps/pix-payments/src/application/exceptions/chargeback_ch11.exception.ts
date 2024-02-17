import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CHARGEBACK_CH11')
export class ChargebackCH11Exception extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'CHARGEBACK_CH11',
      data,
    });
  }
}
