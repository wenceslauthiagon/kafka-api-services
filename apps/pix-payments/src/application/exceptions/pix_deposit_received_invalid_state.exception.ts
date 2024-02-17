import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixDeposit } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEPOSIT_RECEIVED_INVALID_STATE')
export class PixDepositReceivedInvalidStateException extends DefaultException {
  constructor(data: Partial<PixDeposit>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEPOSIT_RECEIVED_INVALID_STATE',
      data,
    });
  }
}
