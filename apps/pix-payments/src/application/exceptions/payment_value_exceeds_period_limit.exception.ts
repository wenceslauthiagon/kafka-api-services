import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'PAYMENT_VALUE_EXCEEDS_PERIOD_LIMIT')
export class PaymentValueExceedsPeriodLimitException extends DefaultException {
  constructor(value: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'PAYMENT_VALUE_EXCEEDS_PERIOD_LIMIT',
      data: value,
    });
  }
}
