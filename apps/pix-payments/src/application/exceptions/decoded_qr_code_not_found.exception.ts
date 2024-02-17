import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { DecodedQrCode } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'QR_CODE_NOT_FOUND')
export class DecodedQrCodeNotFoundException extends DefaultException {
  constructor(data: Partial<DecodedQrCode>) {
    super({
      type: ExceptionTypes.USER,
      code: 'QR_CODE_NOT_FOUND',
      data,
    });
  }
}
