import { IsDefined, IsInt, IsOptional, IsPositive } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  PixStatement,
  PixStatementEntity,
  Statement,
} from '@zro/api-topazio/domain';

export type PixStatementAttributes = PixStatement;
export type PixStatementCreateAttributes = PixStatementAttributes;

export class PixStatementModel
  extends AutoValidator
  implements PixStatementAttributes
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
  statements: Statement[];

  constructor(props: Partial<PixStatementAttributes>) {
    super(props);
  }

  toDomain(): PixStatement {
    return new PixStatementEntity(this);
  }
}
