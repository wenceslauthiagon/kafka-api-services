import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { QrCodeStatic } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'QR_CODE_STATIC_NOT_FOUND')
export class QrCodeStaticNotFoundException extends DefaultException {
  constructor(data: Partial<QrCodeStatic>) {
    super({
      type: ExceptionTypes.USER,
      code: 'QR_CODE_STATIC_NOT_FOUND',
      data,
    });
  }
}
