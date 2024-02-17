import { Domain } from '@zro/common';
import { System } from './system.entity';
import { Provider } from './provider.entity';
import { Currency } from '@zro/operations/domain';
import { CryptoRemittance } from './crypto_remittance.entity';
import { SettlementDateCode } from './remittance_exposure_rule.entity';

export enum RemittanceOrderStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum RemittanceOrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}
export enum RemittanceOrderType {
  EFX = 'EFX',
  CRYPTO = 'CRYPTO',
}
export interface RemittanceOrder extends Domain<string> {
  side: RemittanceOrderSide;
  currency: Currency;
  amount: number;
  status: RemittanceOrderStatus;
  system: System;
  provider: Provider;
  sendDateCode?: SettlementDateCode;
  receiveDateCode?: SettlementDateCode;
  cryptoRemittance?: CryptoRemittance;
  type?: RemittanceOrderType;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RemittanceOrderEntity implements RemittanceOrder {
  id: string;
  side: RemittanceOrderSide;
  currency: Currency;
  amount: number;
  status: RemittanceOrderStatus;
  system: System;
  provider: Provider;
  sendDateCode?: SettlementDateCode;
  receiveDateCode?: SettlementDateCode;
  cryptoRemittance?: CryptoRemittance;
  type?: RemittanceOrderType;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<RemittanceOrder>) {
    Object.assign(this, props);
  }
}
