import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';

export enum SettlementDateCode {
  D0 = 'D0',
  D1 = 'D1',
  D2 = 'D2',
  D3 = 'D3',
  D4 = 'D4',
}

const settlementDateCodeMap = {
  D0: SettlementDateCode.D0,
  D1: SettlementDateCode.D1,
  D2: SettlementDateCode.D2,
  D3: SettlementDateCode.D3,
  D4: SettlementDateCode.D4,
};

export type SettlementDateRule = {
  amount: number;
  sendDate: SettlementDateCode;
  receiveDate: SettlementDateCode;
};

export const settlementDateCodes = (
  settlementDateCodePair: string,
): SettlementDateCode[] => {
  const sendDateCodeString = settlementDateCodePair.split(';')[0];
  const sendDateCode = settlementDateCodeMap[sendDateCodeString];

  const receiveDateCodeString = settlementDateCodePair.split(';')[1];
  const receiveDateCode = settlementDateCodeMap[receiveDateCodeString];

  // Check if settlement date codes are valid.
  if (!sendDateCode || !receiveDateCode) {
    return;
  }

  return [sendDateCode, receiveDateCode];
};

export interface RemittanceExposureRule extends Domain<string> {
  currency: Currency;
  amount: number;
  seconds: number;
  settlementDateRules?: SettlementDateRule[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class RemittanceExposureRuleEntity implements RemittanceExposureRule {
  id: string;
  currency: Currency;
  amount: number;
  seconds: number;
  settlementDateRules?: SettlementDateRule[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<RemittanceExposureRule>) {
    Object.assign(this, props);
  }
}
