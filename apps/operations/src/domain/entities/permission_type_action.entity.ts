import { Domain } from '@zro/common';
import { PermissionAction, PermissionType } from '@zro/operations/domain';

export interface PermissionTypeAction extends Domain<string> {
  permissionType: PermissionType;
  permissionAction: PermissionAction;
}

export class PermissionTypeActionEntity implements PermissionTypeAction {
  id: string;
  permissionType: PermissionType;
  permissionAction: PermissionAction;

  constructor(props: Partial<PermissionTypeAction>) {
    Object.assign(this, props);
  }
}
