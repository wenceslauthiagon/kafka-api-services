import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Remittance } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'REMITTANCE_NOT_FOUND')
export class RemittanceNotFoundException extends DefaultException {
  constructor(remittance: Partial<Remittance>) {
    super({
      type: ExceptionTypes.USER,
      code: 'REMITTANCE_NOT_FOUND',
      data: remittance,
    });
  }
}
