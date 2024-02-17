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
  RemittanceOrderCurrentGroup,
  RemittanceOrderCurrentGroupEntity,
  SettlementDateCode,
  System,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';

export type RemittanceOrderCurrentGroupAttributes = RemittanceOrderCurrentGroup;
export type RemittanceOrderCurrentGroupCreateAttributes =
  RemittanceOrderCurrentGroupAttributes;

export class RemittanceOrderCurrentGroupModel
  extends AutoValidator
  implements RemittanceOrderCurrentGroupAttributes
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
  remittanceOrderGroup?: string[];

  constructor(props: Partial<RemittanceOrderCurrentGroupAttributes>) {
    super(props);
  }

  toDomain(): RemittanceOrderCurrentGroup {
    const entity = new RemittanceOrderCurrentGroupEntity(this);

    entity.currency = new CurrencyEntity({ id: this.currency.id });

    return entity;
  }
}
