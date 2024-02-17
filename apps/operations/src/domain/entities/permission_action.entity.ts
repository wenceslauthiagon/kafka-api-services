import { Domain } from '@zro/common';

export interface PermissionAction extends Domain<string> {
  tag: string;
  description?: string;
  createdAt: Date;
}

export class PermissionActionEntity implements PermissionAction {
  id: string;
  tag: string;
  description?: string;
  createdAt: Date;

  constructor(props: Partial<PermissionAction>) {
    Object.assign(this, props);
  }
}
