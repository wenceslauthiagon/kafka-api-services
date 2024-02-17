import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserLimit } from '@zro/operations/domain';

/**
 * Thrown when user had not enough limit to create operation.
 */
@Exception(ExceptionTypes.USER, 'NOT_ENOUGH_LIMIT')
export class NotEnoughLimitException extends DefaultException {
  constructor(userLimit: UserLimit, value: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOT_ENOUGH_LIMIT',
      data: { userLimit, value },
    });
  }
}
