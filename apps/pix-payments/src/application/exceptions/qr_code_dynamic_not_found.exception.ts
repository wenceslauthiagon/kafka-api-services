import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { QrCodeDynamic } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'QR_CODE_DYNAMIC_NOT_FOUND')
export class QrCodeDynamicNotFoundException extends DefaultException {
  constructor(data: Partial<QrCodeDynamic>) {
    super({
      type: ExceptionTypes.USER,
      code: 'QR_CODE_DYNAMIC_NOT_FOUND',
      data,
    });
  }
}
