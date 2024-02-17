import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'ADDRESS_NOT_FOUND')
export class AddressNotFoundException extends DefaultException {
  constructor(data?: any) {
    super({
      type: ExceptionTypes.USER,
      code: 'ADDRESS_NOT_FOUND',
      data,
    });
  }
}
