import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UsedLimit } from '@zro/operations/domain';

/**
 * Thrown when user tries to create an operation above its daily, monthly or
 * yearly available limits.
 */
@Exception(ExceptionTypes.USER, 'NOT_ENOUGH_AVAILABLE_LIMIT')
export class NotEnoughAvailableLimitException extends DefaultException {
  constructor(usedUserLimit: UsedLimit, value: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOT_ENOUGH_AVAILABLE_LIMIT',
      data: { usedUserLimit, value },
    });
  }
}
