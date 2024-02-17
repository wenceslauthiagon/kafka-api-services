import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserLimit } from '@zro/operations/domain';

/**
 * Thrown when user tries to create an operation which value is under min amount
 * allowed.
 */
@Exception(ExceptionTypes.USER, 'VALUE_IS_ABOVE_MIN_AMOUNT_LIMIT')
export class ValueUnderMinAmountLimitException extends DefaultException {
  constructor(userLimit: UserLimit, value: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'VALUE_IS_ABOVE_MIN_AMOUNT_LIMIT',
      data: { userLimit, value },
    });
  }
}
