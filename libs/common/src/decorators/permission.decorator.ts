import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '@zro/operations/domain';

export const HAS_PERMISSION_ACTION = 'HasPermissionAction';

/**
 * Permission decorator. It's the controller action key. Controllers or handlers decorated with @HasPermission are
 * protected by PermissionGuard
 */
export const HasPermission = (permission: PermissionAction['tag']) =>
  SetMetadata(HAS_PERMISSION_ACTION, permission);
