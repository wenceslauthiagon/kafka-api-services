import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PermissionAction } from '@zro/operations/domain';

/**
 * Thrown when operation was not found in database.
 */
@Exception(ExceptionTypes.SYSTEM, 'PERMISSION_ACTION_NOT_FOUND')
export class PermissionActionNotFoundException extends DefaultException {
  constructor(tag: PermissionAction['tag']) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PERMISSION_ACTION_NOT_FOUND',
      data: { tag },
    });
  }
}
