import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Holiday } from '@zro/quotations/domain';

@Exception(ExceptionTypes.USER, 'HOLIDAY_NOT_FOUND')
export class HolidayNotFoundException extends DefaultException {
  constructor(holiday: Partial<Holiday>) {
    super({
      type: ExceptionTypes.USER,
      code: 'HOLIDAY_NOT_FOUND',
      data: holiday,
    });
  }
}
