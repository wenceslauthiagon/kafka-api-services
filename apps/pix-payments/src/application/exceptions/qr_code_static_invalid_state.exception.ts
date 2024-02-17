import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { QrCodeStatic } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'QR_CODE_STATIC_INVALID_STATE')
export class QrCodeStaticInvalidStateException extends DefaultException {
  constructor(data: Partial<QrCodeStatic>) {
    super({
      type: ExceptionTypes.USER,
      code: 'QR_CODE_STATIC_INVALID_STATE',
      data,
    });
  }
}
