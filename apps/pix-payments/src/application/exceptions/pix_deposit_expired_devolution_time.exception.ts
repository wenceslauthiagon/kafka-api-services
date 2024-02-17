import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixDeposit } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEPOSIT_EXPIRED_DEVOLUTION_TIME')
export class PixDepositExpiredDevolutionTimeException extends DefaultException {
  constructor(data: Partial<PixDeposit>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEPOSIT_EXPIRED_DEVOLUTION_TIME',
      data,
    });
  }
}
