import { Domain } from '@zro/common';
import { Operation, WalletAccount } from '@zro/operations/domain';

export interface PendingWalletAccountTransaction extends Domain<string> {
  operation: Operation;
  walletAccount: WalletAccount;
  value: number;
  ttl?: number;
}

export class PendingWalletAccountTransactionEntity
  implements PendingWalletAccountTransaction
{
  id?: string;
  operation: Operation;
  walletAccount: WalletAccount;
  value: number;
  ttl?: number;

  constructor(props: Partial<PendingWalletAccountTransaction>) {
    Object.assign(this, props);
  }
}
