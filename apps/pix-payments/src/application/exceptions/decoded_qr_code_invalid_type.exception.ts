import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'DECODED_QR_CODE_INVALID_TYPE')
export class DecodedQrCodeInvalidTypeException extends DefaultException {
  constructor(type: string) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'DECODED_QR_CODE_INVALID_TYPE',
      data: type,
    });
  }
}
