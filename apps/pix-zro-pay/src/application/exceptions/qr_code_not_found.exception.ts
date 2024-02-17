import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { QrCode } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'QR_CODE_NOT_FOUND')
export class QrCodeNotFoundException extends DefaultException {
  constructor(data: Partial<QrCode>) {
    super({
      type: ExceptionTypes.USER,
      code: 'QR_CODE_NOT_FOUND',
      data,
    });
  }
}
