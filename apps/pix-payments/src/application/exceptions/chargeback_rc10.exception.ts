import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CHARGEBACK_RC10')
export class ChargebackRC10Exception extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'CHARGEBACK_RC10',
      data,
    });
  }
}
