import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when operation was not found in database.
 */
@Exception(ExceptionTypes.USER, 'OPERATION_NOT_FOUND')
export class OperationNotFoundException extends DefaultException {
  constructor(id: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'OPERATION_NOT_FOUND',
      data: { id },
    });
  }
}
