import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { DecodedQrCode } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'DECODED_QR_CODE_EXPIRED')
export class DecodedQrCodeExpiredException extends DefaultException {
  constructor(data: Partial<DecodedQrCode>) {
    super({
      type: ExceptionTypes.USER,
      code: 'DECODED_QR_CODE_EXPIRED',
      data,
    });
  }
}
