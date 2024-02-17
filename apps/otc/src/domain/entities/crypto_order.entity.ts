import { Domain } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  OrderSide,
  OrderType,
  Conversion,
  CryptoRemittance,
  System,
  Provider,
} from '@zro/otc/domain';
import { User } from '@zro/users/domain';

export enum CryptoOrderState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  RECONCILIED = 'RECONCILIED',
}

export interface CryptoOrder extends Domain<string> {
  baseCurrency: Currency;
  amount: number;
  type: OrderType;
  side: OrderSide;
  state: CryptoOrderState;
  system: System;
  conversion?: Conversion;
  user?: User;
  provider?: Provider;
  createdAt?: Date;
  clientName?: string;
  clientDocument?: string;
  clientDocumentType?: string;
  cryptoRemittance?: CryptoRemittance;
  remainingCryptoRemittance?: CryptoRemittance;
  previousCryptoRemittance?: CryptoRemittance;
  reconciledId?: string;
  price?: number;
  stopPrice?: number;
  validUntil?: Date;
}

export class CryptoOrderEntity implements CryptoOrder {
  id: string;
  baseCurrency: Currency;
  amount: number;
  type: OrderType;
  side: OrderSide;
  state: CryptoOrderState;
  system: System;
  conversion?: Conversion;
  user?: User;
  provider?: Provider;
  createdAt?: Date;
  clientName?: string;
  clientDocument?: string;
  clientDocumentType?: string;
  cryptoRemittance?: CryptoRemittance;
  remainingCryptoRemittance?: CryptoRemittance;
  previousCryptoRemittance?: CryptoRemittance;
  reconciledId?: string;
  price?: number;
  stopPrice?: number;
  validUntil?: Date;

  constructor(props: Partial<CryptoOrder>) {
    Object.assign(this, props);
  }
}
