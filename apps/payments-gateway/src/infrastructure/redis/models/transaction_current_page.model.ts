import { IsInt, IsPositive } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  TransactionCurrentPage,
  TransactionCurrentPageEntity,
} from '@zro/payments-gateway/domain';

export type TransactionCurrentPageAttributes = TransactionCurrentPage;
export type TransactionCurrentPageCreateAttributes =
  TransactionCurrentPageAttributes;

export class TransactionCurrentPageModel
  extends AutoValidator
  implements TransactionCurrentPageAttributes
{
  @IsInt()
  @IsPositive()
  actualPage: number;

  @IsIsoStringDateFormat('YYYY-MM-DD')
  createdDate: string;

  constructor(props: Partial<TransactionCurrentPageAttributes>) {
    super(props);
  }

  toDomain(): TransactionCurrentPage {
    return new TransactionCurrentPageEntity(this);
  }
}
