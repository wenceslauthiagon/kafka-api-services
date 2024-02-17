import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { PixDeposit } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEPOSIT_INVALID_STATE')
export class PixDepositInvalidStateException extends DefaultException {
  constructor(data: Partial<PixDeposit>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEPOSIT_INVALID_STATE',
      data,
    });
  }
}
