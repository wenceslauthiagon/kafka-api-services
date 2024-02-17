import {
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
  StreamQuotationGateway,
  StreamQuotationGatewayEntity,
} from '@zro/quotations/domain';

export type StreamQuotationGatewayAttributes = StreamQuotationGateway;
export type StreamQuotationGatewayCreateAttributes =
  StreamQuotationGatewayAttributes;

export class StreamQuotationGatewayModel
  extends AutoValidator
  implements StreamQuotationGatewayAttributes
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

  constructor(props: Partial<StreamQuotationGatewayCreateAttributes>) {
    super(Object.assign({}, props, { timestamp: new Date(props.timestamp) }));
  }

  toDomain(): StreamQuotationGateway {
    return new StreamQuotationGatewayEntity({
      id: this.id,
      buy: this.buy,
      sell: this.sell,
      amount: this.amount,
      gatewayName: this.gatewayName,
      timestamp: new Date(this.timestamp),
      baseCurrency: new CurrencyEntity(this.baseCurrency),
      quoteCurrency: new CurrencyEntity(this.quoteCurrency),
    });
  }
}
