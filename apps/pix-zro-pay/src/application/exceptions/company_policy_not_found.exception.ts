import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { CompanyPolicy } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'COMPANY_POLICY_NOT_FOUND')
export class CompanyPolicyNotFoundException extends DefaultException {
  constructor(data: Partial<CompanyPolicy>) {
    super({
      type: ExceptionTypes.USER,
      code: 'COMPANY_POLICY_NOT_FOUND',
      data,
    });
  }
}
