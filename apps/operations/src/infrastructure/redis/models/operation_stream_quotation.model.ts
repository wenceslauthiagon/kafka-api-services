import { IsDefined, IsInt, IsPositive, IsString } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  OperationStreamQuotation,
  OperationStreamQuotationEntity,
} from '@zro/operations/domain';

export type OperationStreamQuotationAttributes = OperationStreamQuotation;
export type OperationStreamQuotationCreateAttributes =
  OperationStreamQuotationAttributes;

export class OperationStreamQuotationModel
  extends AutoValidator
  implements OperationStreamQuotationAttributes
{
  @IsDefined()
  quoteCurrency: Currency;

  @IsDefined()
  baseCurrency: Currency;

  @IsString()
  provider: string;

  @IsInt()
  priority: number;

  @IsPositive()
  price: number;

  @IsPositive()
  priceBuy: number;

  @IsPositive()
  priceSell: number;

  constructor(props: Partial<OperationStreamQuotationAttributes>) {
    super(props);
  }

  toDomain(): OperationStreamQuotation {
    return new OperationStreamQuotationEntity(this);
  }
}
