import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Client } from '@zro/pix-zro-pay/domain';

@Exception(ExceptionTypes.USER, 'CLIENT_IS_BLACKLISTED')
export class ClientIsBlacklistedException extends DefaultException {
  constructor(data: Partial<Client>) {
    super({
      type: ExceptionTypes.USER,
      code: 'CLIENT_IS_BLACKLISTED',
      data,
    });
  }
}
