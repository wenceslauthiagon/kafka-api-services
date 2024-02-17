import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WarningPixDeposit } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.ADMIN, 'WARNING_PIX_DEPOSIT_NOT_FOUND')
export class WarningPixDepositNotFoundException extends DefaultException {
  constructor(data: Partial<WarningPixDeposit>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'WARNING_PIX_DEPOSIT_NOT_FOUND',
      data,
    });
  }
}
