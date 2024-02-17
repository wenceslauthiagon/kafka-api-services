import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Client } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'CLIENT_NOT_FOUND')
export class ClientNotFoundException extends DefaultException {
  constructor(data: Partial<Client>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CLIENT_NOT_FOUND',
      data,
    });
  }
}
