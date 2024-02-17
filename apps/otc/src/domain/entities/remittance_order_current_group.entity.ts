import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { System, Provider, SettlementDateCode } from '@zro/otc/domain';

export interface RemittanceOrderCurrentGroup extends Domain<string> {
  currency: Currency;
  system: System;
  provider: Provider;
  sendDateCode: SettlementDateCode;
  receiveDateCode: SettlementDateCode;
  groupAmount: number;
  groupAmountDate?: Date;
  dailyAmount: number;
  dailyAmountDate?: Date;
  remittanceOrderGroup?: string[];
}

export class RemittanceOrderCurrentGroupEntity
  implements RemittanceOrderCurrentGroup
{
  currency: Currency;
  system: System;
  provider: Provider;
  sendDateCode: SettlementDateCode;
  receiveDateCode: SettlementDateCode;
  groupAmount: number;
  groupAmountDate?: Date;
  dailyAmount: number;
  dailyAmountDate?: Date;
  remittanceOrderGroup?: string[];

  constructor(props: Partial<RemittanceOrderCurrentGroup>) {
    Object.assign(this, props);
  }
}
