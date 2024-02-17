import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { Conversion } from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';

export interface Cashback extends Domain<string> {
  user: User;
  conversion: Conversion;
  amount: number;
  currency: Currency;
  description?: string;
  issuedBy?: string;
  createdAt?: Date;
}

export class CashbackEntity implements Cashback {
  id: string;
  user: User;
  conversion: Conversion;
  amount: number;
  currency: Currency;
  description?: string;
  issuedBy?: string;
  createdAt?: Date;

  constructor(props: Partial<Cashback>) {
    Object.assign(this, props);
  }
}
