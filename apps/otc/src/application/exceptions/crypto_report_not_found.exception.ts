import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'CRYPTO_REPORT_NOT_FOUND')
export class CryptoReportNotFoundException extends DefaultException {
  constructor(fileName: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'CRYPTO_REPORT_NOT_FOUND',
      data: fileName,
    });
  }
}
