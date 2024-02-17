import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserLimit } from '@zro/operations/domain';

/**
 * Thrown when user tries to create an operation which value is above max amount
 * nightly allowed.
 */
@Exception(ExceptionTypes.USER, 'VALUE_IS_ABOVE_MAX_AMOUNT_NIGHTLY_LIMIT')
export class ValueAboveMaxAmountNightlyLimitException extends DefaultException {
  constructor(userLimit: UserLimit, value: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'VALUE_IS_ABOVE_MAX_AMOUNT_NIGHTLY_LIMIT',
      data: { userLimit, value },
    });
  }
}
