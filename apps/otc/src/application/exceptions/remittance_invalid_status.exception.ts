import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Remittance } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'REMITTANCE_INVALID_STATUS')
export class RemittanceInvalidStatusException extends DefaultException {
  constructor(remittance: Partial<Remittance>) {
    super({
      type: ExceptionTypes.USER,
      code: 'REMITTANCE_INVALID_STATUS',
      data: remittance,
    });
  }
}
