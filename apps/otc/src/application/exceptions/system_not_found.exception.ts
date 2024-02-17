import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { System } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'SYSTEM_NOT_FOUND')
export class SystemNotFoundException extends DefaultException {
  constructor(system: Partial<System>) {
    super({
      type: ExceptionTypes.USER,
      code: 'SYSTEM_NOT_FOUND',
      data: system,
    });
  }
}
