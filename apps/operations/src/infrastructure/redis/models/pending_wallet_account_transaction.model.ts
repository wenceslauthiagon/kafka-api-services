import {
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  Operation,
  WalletAccount,
  PendingWalletAccountTransaction,
  PendingWalletAccountTransactionEntity,
  OperationEntity,
  WalletAccountEntity,
} from '@zro/operations/domain';

type PendingWalletAccountTransactionAttributes =
  PendingWalletAccountTransaction;

type PendingWalletAccountTransactionCreateAttributes =
  PendingWalletAccountTransactionAttributes;

export class PendingWalletAccountTransactionModel
  extends AutoValidator
  implements PendingWalletAccountTransactionAttributes
{
  @IsDefined()
  operation: Operation;

  @IsDefined()
  walletAccount: WalletAccount;

  @IsNumber()
  value: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  ttl?: number;

  constructor(props: Partial<PendingWalletAccountTransactionCreateAttributes>) {
    super(props);
  }

  toDomain(): PendingWalletAccountTransaction {
    const entity = new PendingWalletAccountTransactionEntity(this);
    entity.operation = new OperationEntity({
      id: this.operation.id,
    });
    entity.walletAccount = new WalletAccountEntity({
      id: this.walletAccount.id,
    });

    return entity;
  }
}
