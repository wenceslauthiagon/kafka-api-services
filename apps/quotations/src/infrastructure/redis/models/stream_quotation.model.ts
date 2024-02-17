import {
  IsArray,
  IsDate,
  IsDefined,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  StreamPair,
  StreamPairEntity,
  StreamQuotation,
  StreamQuotationEntity,
} from '@zro/quotations/domain';

export type StreamQuotationAttributes = StreamQuotation;
export type StreamQuotationCreateAttributes = StreamQuotationAttributes;

export class StreamQuotationModel
  extends AutoValidator
  implements StreamQuotationAttributes
{
  @IsUUID(4)
  id: string;

  @IsDefined()
  baseCurrency: Currency;

  @IsDefined()
  quoteCurrency: Currency;

  @IsOptional()
  @IsPositive()
  buy: number;

  @IsOptional()
  @IsPositive()
  sell: number;

  @IsOptional()
  @IsPositive()
  amount: number;

  @IsString()
  gatewayName: string;

  @IsDate()
  timestamp: Date;

  @IsOptional()
  @IsArray()
  composedBy?: StreamQuotation[];

  @IsDefined()
  streamPair: StreamPair;

  constructor(props: Partial<StreamQuotationCreateAttributes>) {
    super(Object.assign({}, props, { timestamp: new Date(props.timestamp) }));
  }

  toDomain(): StreamQuotation {
    const data: Omit<StreamQuotation, 'isSynthetic'> = {
      id: this.id,
      buy: this.buy,
      sell: this.sell,
      amount: this.amount,
      gatewayName: this.gatewayName,
      timestamp: new Date(this.timestamp),
      baseCurrency: new CurrencyEntity(this.baseCurrency),
      quoteCurrency: new CurrencyEntity(this.quoteCurrency),
      composedBy: this.composedBy?.map(
        (quotation) => new StreamQuotationEntity(quotation),
      ),
      streamPair: new StreamPairEntity(this.streamPair),
    };
    return new StreamQuotationEntity(data);
  }

  isSynthetic(): boolean {
    return this.toDomain().isSynthetic();
  }
}
