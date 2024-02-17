import { Domain, getMoment } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  ExchangeContract,
  System,
  SettlementDateCode,
  Provider,
} from '@zro/otc/domain';

export enum RemittanceStatus {
  OPEN = 'open',
  WAITING = 'waiting', // sent to PSP, waiting for confirmation.
  CLOSED = 'closed',
  CLOSED_MANUALLY = 'closed_manually',
}

export enum RemittanceSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum RemittanceType {
  EFX = 'EFX',
  CRYPTO = 'CRYPTO',
}

export const SETTLEMENT_DATE_MAP = {
  D0: 0,
  D1: 1,
  D2: 2,
  D3: 3,
  D4: 4,
};

export function settlementDateFromCodeToDate(
  date: Date,
  sendDateCode: SettlementDateCode,
  receiveDateCode: SettlementDateCode,
): Partial<Remittance> {
  const sendDateCodeNumber = SETTLEMENT_DATE_MAP[sendDateCode];
  const receiveDateCodeNumber = SETTLEMENT_DATE_MAP[receiveDateCode];

  const sendDate = getMoment(date).add(sendDateCodeNumber, 'days');
  const receiveDate = getMoment(date).add(receiveDateCodeNumber, 'days');

  // Next util day should not be saturday or sunday.
  const sendWeekDay = sendDate.day();
  if (sendWeekDay === 0) sendDate.add(1, 'day');
  else if (sendWeekDay === 6) sendDate.add(2, 'day');
  const receiveWeekDay = receiveDate.day();
  if (receiveWeekDay === 0) receiveDate.add(1, 'day');
  else if (receiveWeekDay === 6) receiveDate.add(2, 'day');

  return {
    sendDate: sendDate.toDate(),
    receiveDate: receiveDate.toDate(),
  };
}

export interface Remittance extends Domain<string> {
  id: string;
  resultAmount?: number;
  side: RemittanceSide;
  type: RemittanceType;
  currency: Currency;
  amount: number;
  status: RemittanceStatus;
  system: System;
  provider?: Provider;
  sendDate: Date;
  receiveDate: Date;
  sendDateCode?: SettlementDateCode;
  receiveDateCode?: SettlementDateCode;
  exchangeContract?: ExchangeContract;
  bankQuote?: number;
  iof?: number;
  isConcomitant?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RemittanceEntity implements Remittance {
  id: string;
  side: RemittanceSide;
  type: RemittanceType;
  currency: Currency;
  amount: number;
  resultAmount?: number;
  status: RemittanceStatus;
  system: System;
  provider?: Provider;
  sendDate: Date;
  receiveDate: Date;
  sendDateCode?: SettlementDateCode;
  receiveDateCode?: SettlementDateCode;
  exchangeContract?: ExchangeContract;
  bankQuote?: number;
  iof?: number;
  isConcomitant?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<Remittance>) {
    Object.assign(this, props);
  }
}
