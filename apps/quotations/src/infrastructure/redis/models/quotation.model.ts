import {
  IsDefined,
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Quotation, QuotationEntity } from '@zro/quotations/domain';

export type QuotationAttributes = Quotation;
export type QuotationCreateAttributes = QuotationAttributes;

export class QuotationModel
  extends AutoValidator
  implements QuotationAttributes
{
  @IsUUID(4)
  id: string;

  @IsDefined()
  provider: Quotation['provider'];

  @IsDefined()
  streamPair: Quotation['streamPair'];

  @IsString()
  side: Quotation['side'];

  @IsInt()
  @IsPositive()
  price: number;

  @IsInt()
  @IsPositive()
  priceBuy: number;

  @IsInt()
  @IsPositive()
  priceSell: number;

  @IsInt()
  @IsPositive()
  partialBuy: number;

  @IsInt()
  @IsPositive()
  partialSell: number;

  @IsDefined()
  iof: Quotation['iof'];

  @IsInt()
  @Min(0)
  iofAmount: number;

  @IsDefined()
  spreads: Quotation['spreads'];

  @IsInt()
  @Min(0)
  spreadBuy: number;

  @IsInt()
  @Min(0)
  spreadSell: number;

  @IsInt()
  @Min(0)
  spreadAmountBuy: number;

  @IsInt()
  @Min(0)
  spreadAmountSell: number;

  @IsDefined()
  quoteCurrency: Quotation['quoteCurrency'];

  @IsInt()
  @IsPositive()
  quoteAmountBuy: number;

  @IsInt()
  @IsPositive()
  quoteAmountSell: number;

  @IsDefined()
  baseCurrency: Quotation['baseCurrency'];

  @IsInt()
  @IsPositive()
  baseAmountBuy: number;

  @IsInt()
  @IsPositive()
  baseAmountSell: number;

  @IsDefined()
  streamQuotation: Quotation['streamQuotation'];

  constructor(props: Partial<QuotationCreateAttributes>) {
    super(props);
  }

  toDomain(): Quotation {
    return new QuotationEntity(this);
  }

  get spreadBuyFloat(): number {
    return this.toDomain().spreadBuyFloat;
  }

  get spreadSellFloat(): number {
    return this.toDomain().spreadSellFloat;
  }
}
