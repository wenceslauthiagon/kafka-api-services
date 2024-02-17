import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Remittance } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'REMITTANCE_ORDER_NOT_FOUND')
export class RemittanceOrderNotFoundException extends DefaultException {
  constructor(remittance: Partial<Remittance>) {
    super({
      type: ExceptionTypes.USER,
      code: 'REMITTANCE_ORDER_NOT_FOUND',
      data: remittance,
    });
  }
}
