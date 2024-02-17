import {
  IsArray,
  IsOptional,
  IsInt,
  IsDefined,
  IsString,
  IsEnum,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Provider,
  RemittanceCurrentGroup,
  RemittanceCurrentGroupEntity,
  SettlementDateCode,
  System,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';

export type RemittanceCurrentGroupAttributes = RemittanceCurrentGroup;
export type RemittanceCurrentGroupCreateAttributes =
  RemittanceCurrentGroupAttributes;

export class RemittanceCurrentGroupModel
  extends AutoValidator
  implements RemittanceCurrentGroupAttributes
{
  @IsDefined()
  currency: Currency;

  @IsDefined()
  system: System;

  @IsDefined()
  provider: Provider;

  @IsEnum(SettlementDateCode)
  sendDateCode: SettlementDateCode;

  @IsEnum(SettlementDateCode)
  receiveDateCode: SettlementDateCode;

  @IsInt()
  groupAmount: number;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  groupAmountDate?: Date;

  @IsInt()
  dailyAmount: number;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  dailyAmountDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dailyRemittanceGroup?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remittanceGroup?: string[];

  constructor(props: Partial<RemittanceCurrentGroupAttributes>) {
    super(props);
  }

  toDomain(): RemittanceCurrentGroup {
    const entity = new RemittanceCurrentGroupEntity(this);

    entity.currency = new CurrencyEntity({ id: this.currency.id });

    return entity;
  }
}
