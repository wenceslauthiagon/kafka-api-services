import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(
  ExceptionTypes.USER,
  'PIX_DEVOLUTION_RECEIVED_BANK_NOT_ALLOWED_EXCEPTION',
)
export class PixDevolutionReceivedBankNotAllowedException extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEVOLUTION_RECEIVED_BANK_NOT_ALLOWED_EXCEPTION',
      data,
    });
  }
}
