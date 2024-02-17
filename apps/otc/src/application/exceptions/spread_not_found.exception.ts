import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Spread } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'SPREAD_NOT_FOUND')
export class SpreadNotFoundException extends DefaultException {
  constructor(spread: Partial<Spread>) {
    super({
      type: ExceptionTypes.USER,
      code: 'SPREAD_NOT_FOUND',
      data: spread,
    });
  }
}
