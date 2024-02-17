import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'PIX_DEPOSIT_RECEIVED_ACCOUNT_NOT_FOUND')
export class PixDepositReceivedAccountNotFoundException extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEPOSIT_RECEIVED_ACCOUNT_NOT_FOUND',
      data,
    });
  }
}
