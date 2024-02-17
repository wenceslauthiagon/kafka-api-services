import { Domain } from '@zro/common';
import { PersonType } from '@zro/users/domain';

export enum TypeConfig {
  F = 'F',
  J = 'J',
}

/**
 * Report User Config.
 */
export interface ReportUserConfig extends Domain<string> {
  type: PersonType;
  description: string;
  typeConfig: TypeConfig;
  createdAt: Date;
  updatedAt: Date;
}

export class ReportUserConfigEntity implements ReportUserConfig {
  id!: string;
  type: PersonType;
  description: string;
  typeConfig: TypeConfig;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<ReportUserConfigEntity>) {
    Object.assign(this, props);
  }
}
