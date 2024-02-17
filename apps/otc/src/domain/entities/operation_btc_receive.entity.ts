import { Domain } from '@zro/common';
import {
  Currency,
  OperationState,
  TransactionType,
  WalletAccount,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export interface OperationBtcReceive extends Domain<string> {
  beneficiaryWalletBcoinId: string;
  beneficiaryWalletAddress: string;
  transactionHash: string;
  transactionRegTx: string;
  confirmations: number;
  beneficiary: User;
  beneficiaryWalletAccount: WalletAccount;
  transactionType: TransactionType;
  currency: Currency;
  value: number;
  usdReceivedQuote: number;
  btcReceivedQuote: number;
  usdConfirmedQuote: number;
  btcConfirmedQuote: number;
  userFiatAmount: number;
  description: string;
  state: OperationState;
  createdAt: Date;
  updatedAt: Date;
}

export class OperationBtcReceiveEntity implements OperationBtcReceive {
  id: string;
  beneficiaryWalletBcoinId: string;
  beneficiaryWalletAddress: string;
  transactionHash: string;
  transactionRegTx: string;
  confirmations: number;
  beneficiary: User;
  beneficiaryWalletAccount: WalletAccount;
  transactionType: TransactionType;
  currency: Currency;
  value: number;
  usdReceivedQuote: number;
  btcReceivedQuote: number;
  usdConfirmedQuote: number;
  btcConfirmedQuote: number;
  userFiatAmount: number;
  description: string;
  state: OperationState;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<OperationBtcReceive>) {
    Object.assign(this, props);
  }
}
