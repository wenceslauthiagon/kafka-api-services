import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from './wallet.entity';
import { Currency } from './currency.entity';
import { Operation } from './operation.entity';

export interface P2PTransfer extends Domain<string> {
  user: User;
  wallet: Wallet;
  beneficiaryWallet: Wallet;
  currency: Currency;
  operation: Operation;
  amount: number;
  fee: number;
  description?: string;
  createdAt: Date;
}

export class P2PTransferEntity implements P2PTransfer {
  id: string;
  user: User;
  wallet: Wallet;
  beneficiaryWallet: Wallet;
  currency: Currency;
  operation: Operation;
  amount: number;
  fee: number;
  description?: string;
  createdAt: Date;

  constructor(props: Partial<P2PTransfer>) {
    Object.assign(this, props);
  }
}
