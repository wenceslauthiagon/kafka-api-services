import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'BANKING_TED_HOLIDAY_INVALID')
export class BankingTedHolidayInvalidException extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANKING_TED_HOLIDAY_INVALID',
      data,
    });
  }
}
