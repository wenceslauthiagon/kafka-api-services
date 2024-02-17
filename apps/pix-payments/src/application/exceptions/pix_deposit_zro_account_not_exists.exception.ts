import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixDeposit } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEPOSIT_ZRO_ACCOUNT_NOT_EXISTS')
export class PixDepositZroAccountNotExistsException extends DefaultException {
  constructor(data: Partial<PixDeposit>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEPOSIT_ZRO_ACCOUNT_NOT_EXISTS',
      data,
    });
  }
}
