import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { StreamPair, StreamPairEntity } from '@zro/quotations/domain';

export type StreamPairAttributes = StreamPair;
export type StreamPairCreateAttributes = StreamPairAttributes;

export class StreamPairModel
  extends AutoValidator
  implements StreamPairAttributes
{
  @IsUUID(4)
  id: string;

  @IsDefined()
  baseCurrency: Currency;

  @IsDefined()
  quoteCurrency: Currency;

  @IsNumber()
  priority: number;

  @IsString()
  gatewayName: string;

  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsArray()
  composedBy?: StreamPair[];

  constructor(props: Partial<StreamPairCreateAttributes>) {
    super(props);
  }

  toDomain(): StreamPair {
    return new StreamPairEntity({
      id: this.id,
      baseCurrency: new CurrencyEntity(this.baseCurrency),
      quoteCurrency: new CurrencyEntity(this.quoteCurrency),
      priority: this.priority,
      gatewayName: this.gatewayName,
      active: this.active,
      composedBy: this.composedBy?.map((pair) => new StreamPairEntity(pair)),
    });
  }

  isSynthetic(): boolean {
    return this.toDomain().isSynthetic();
  }
}
