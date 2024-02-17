import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CHARGEBACK_AB11')
export class ChargebackAB11Exception extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'CHARGEBACK_AB11',
      data,
    });
  }
}
