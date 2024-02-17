import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'PIX_DEPOSIT_RECEIVED_NOT_FOUND_EXCEPTION')
export class PixDepositReceivedNotFoundException extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEPOSIT_RECEIVED_NOT_FOUND_EXCEPTION',
      data,
    });
  }
}
