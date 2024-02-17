import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { OperationState } from '@zro/operations/domain';

/**
 * Thrown when user tries to update an operation that is in invalid state.
 */
@Exception(ExceptionTypes.USER, 'OPERATION_INVALID_STATE')
export class OperationInvalidStateException extends DefaultException {
  constructor(state: OperationState) {
    super({
      type: ExceptionTypes.USER,
      code: 'OPERATION_INVALID_STATE',
      data: { state },
    });
  }
}
