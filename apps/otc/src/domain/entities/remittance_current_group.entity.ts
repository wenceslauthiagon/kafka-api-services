import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { System, Provider, SettlementDateCode } from '@zro/otc/domain';

export interface RemittanceCurrentGroup extends Domain<string> {
  currency: Currency;
  system: System;
  provider: Provider;
  sendDateCode: SettlementDateCode;
  receiveDateCode: SettlementDateCode;
  groupAmount: number;
  groupAmountDate?: Date;
  dailyAmount: number;
  dailyAmountDate?: Date;
  dailyRemittanceGroup?: string[];
  remittanceGroup?: string[];
}

export class RemittanceCurrentGroupEntity implements RemittanceCurrentGroup {
  currency: Currency;
  system: System;
  provider: Provider;
  sendDateCode: SettlementDateCode;
  receiveDateCode: SettlementDateCode;
  groupAmount: number;
  groupAmountDate?: Date;
  dailyAmount: number;
  dailyAmountDate?: Date;
  dailyRemittanceGroup?: string[];
  remittanceGroup?: string[];

  constructor(props: Partial<RemittanceCurrentGroup>) {
    Object.assign(this, props);
  }
}
