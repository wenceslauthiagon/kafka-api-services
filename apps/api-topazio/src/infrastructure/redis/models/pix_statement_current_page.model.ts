import { IsInt, IsPositive } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  PixStatementCurrentPage,
  PixStatementCurrentPageEntity,
} from '@zro/api-topazio/domain';

export type PixStatementCurrentPageAttributes = PixStatementCurrentPage;
export type PixStatementCurrentPageCreateAttributes =
  PixStatementCurrentPageAttributes;

export class PixStatementCurrentPageModel
  extends AutoValidator
  implements PixStatementCurrentPageAttributes
{
  @IsInt()
  @IsPositive()
  actualPage: number;

  @IsIsoStringDateFormat('YYYY-MM-DD')
  createdDate: string;

  constructor(props: Partial<PixStatementCurrentPageAttributes>) {
    super(props);
  }

  toDomain(): PixStatementCurrentPage {
    return new PixStatementCurrentPageEntity(this);
  }
}
