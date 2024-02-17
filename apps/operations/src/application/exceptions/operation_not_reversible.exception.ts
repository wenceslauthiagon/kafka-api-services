import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { Operation } from '@zro/operations/domain';

/**
 * Thrown when user tries to revert an operation without owner.
 */
@Exception(ExceptionTypes.USER, 'OPERATION_NOT_REVERSIBLE')
export class OperationNotReversibleException extends DefaultException {
  constructor(operation: Operation) {
    super({
      type: ExceptionTypes.USER,
      code: 'OPERATION_NOT_REVERSIBLE',
      data: { operation },
    });
  }
}
