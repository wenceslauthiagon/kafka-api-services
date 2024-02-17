import { Domain } from '@zro/common';

/**
 * Bank.
 */
export interface Bank extends Domain<string> {
  ispb: string;
  name: string;
  fullName: string;
  active?: boolean;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isSameIspb(ispb: string): boolean;
}

export class BankEntity implements Bank {
  id: string;
  ispb: string;
  name: string;
  fullName: string;
  active?: boolean;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: Partial<Bank>) {
    Object.assign(this, props);
  }

  isSameIspb(ispb: string): boolean {
    return this.ispb === ispb;
  }
}
