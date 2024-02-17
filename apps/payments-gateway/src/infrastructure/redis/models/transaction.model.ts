import { IsDefined, IsInt, IsOptional, IsPositive } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Transaction,
  TransactionEntity,
  TransactionStatement,
} from '@zro/payments-gateway/domain';

export type TransactionAttributes = Transaction;
export type TransactionCreateAttributes = TransactionAttributes;

export class TransactionModel
  extends AutoValidator
  implements TransactionAttributes
{
  @IsInt()
  @IsPositive()
  page: number;

  @IsInt()
  @IsPositive()
  size: number;

  @IsIsoStringDateFormat('YYYY-MM-DD')
  createdDate: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  ttl?: number;

  @IsDefined()
  transactions: TransactionStatement[];

  constructor(props: Partial<TransactionAttributes>) {
    super(props);
  }

  toDomain(): Transaction {
    return new TransactionEntity(this);
  }
}
