import { Domain } from '@zro/common';

/**
 * BankTed.
 */
export interface BankTed extends Domain<string> {
  ispb: string;
  code: string;
  name: string;
  fullName: string;
  active?: boolean;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class BankTedEntity implements BankTed {
  id: string;
  ispb: string;
  code: string;
  name: string;
  fullName: string;
  active?: boolean;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: Partial<BankTed>) {
    Object.assign(this, props);
  }
}
