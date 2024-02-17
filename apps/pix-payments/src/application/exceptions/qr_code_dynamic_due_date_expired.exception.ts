import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { QrCodeDynamic } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'QR_CODE_DYNAMIC_DUE_DATE_EXPIRED')
export class QrCodeDynamicDueDateExpiredException extends DefaultException {
  constructor(data: Partial<QrCodeDynamic>) {
    super({
      type: ExceptionTypes.USER,
      code: 'QR_CODE_DYNAMIC_DUE_DATE_EXPIRED',
      data,
    });
  }
}
