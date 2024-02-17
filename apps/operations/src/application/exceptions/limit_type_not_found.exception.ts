import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { LimitType } from '@zro/operations/domain';

/**
 * Thrown when limit type was not found in database.
 */
@Exception(ExceptionTypes.USER, 'LIMIT_TYPE_NOT_FOUND')
export class LimitTypeNotFoundException extends DefaultException {
  constructor(limitType: Partial<LimitType>) {
    super({
      type: ExceptionTypes.USER,
      code: 'LIMIT_TYPE_NOT_FOUND',
      data: limitType,
    });
  }
}
