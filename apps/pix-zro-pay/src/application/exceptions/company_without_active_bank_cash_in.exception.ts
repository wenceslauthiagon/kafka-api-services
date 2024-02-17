import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Company } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'COMPANY_WITHOUT_ACTIVE_BANK_CASH_IN')
export class CompanyWithoutActiveBankCashInException extends DefaultException {
  constructor(company: Partial<Company>) {
    super({
      type: ExceptionTypes.USER,
      code: 'COMPANY_WITHOUT_ACTIVE_BANK_CASH_IN',
      data: company,
    });
  }
}
