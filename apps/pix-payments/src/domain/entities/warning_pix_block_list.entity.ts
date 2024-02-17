import { Domain } from '@zro/common';

/**
 * WarningPixBlockList.
 */
export interface WarningPixBlockList extends Domain<string> {
  cpf: string;
  description?: string;
  reviewAssignee: number;
  createdAt: Date;
  updatedAt: Date;
}

export class WarningPixBlockListEntity implements WarningPixBlockList {
  id!: string;
  cpf!: string;
  description?: string;
  reviewAssignee!: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<WarningPixBlockList>) {
    Object.assign(this, props);
  }
}
