import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BankAccount } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'BANK_ACCOUNT_GATEWAY_NOT_FOUND')
export class BankAccountGatewayNotFoundException extends DefaultException {
  constructor(data: Partial<BankAccount>) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANK_ACCOUNT_GATEWAY_NOT_FOUND',
      data,
    });
  }
}
