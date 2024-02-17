import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'KYC_NOT_FOUND')
export class KYCNotFoundException extends DefaultException {
  constructor(document: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'KYC_NOT_FOUND',
      data: document,
    });
  }
}
