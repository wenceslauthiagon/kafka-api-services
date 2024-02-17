import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Company } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'COMPANY_NOT_FOUND')
export class CompanyNotFoundException extends DefaultException {
  constructor(company: Partial<Company>) {
    super({
      type: ExceptionTypes.USER,
      code: 'COMPANY_NOT_FOUND',
      data: company,
    });
  }
}
