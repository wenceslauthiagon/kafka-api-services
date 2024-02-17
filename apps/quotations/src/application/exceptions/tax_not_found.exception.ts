import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Tax } from '@zro/quotations/domain';

@Exception(ExceptionTypes.USER, 'TAX_NOT_FOUND')
export class TaxNotFoundException extends DefaultException {
  constructor(data: Partial<Tax>) {
    super({
      type: ExceptionTypes.USER,
      code: 'TAX_NOT_FOUND',
      data,
    });
  }
}
