import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'QR_CODE_STATIC_INVALID_VALUE')
export class QrCodeInvalidValueException extends DefaultException {
  constructor(value: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'QR_CODE_INVALID_VALUE',
      data: value,
    });
  }
}
