import { Domain } from '@zro/common';

export interface PermissionType extends Domain<string> {
  tag: string;
  description?: string;
}

export class PermissionTypeEntity implements PermissionType {
  id: string;
  tag: string;
  description?: string;

  constructor(props: Partial<PermissionType>) {
    Object.assign(this, props);
  }
}
