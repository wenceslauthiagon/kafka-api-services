import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'BANKING_TED_WEEKDAY_INVALID')
export class BankingTedWeekdayInvalidException extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANKING_TED_WEEKDAY_INVALID',
      data,
    });
  }
}
