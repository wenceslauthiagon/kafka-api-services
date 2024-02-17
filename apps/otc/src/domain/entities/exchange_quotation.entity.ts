import { Domain } from '@zro/common';
import { Provider, System } from '@zro/otc/domain';

export enum ExchangeQuotationState {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
}

export interface ExchangeQuotation extends Domain<string> {
  quotationPspId: string;
  solicitationPspId: string;
  quotation: number;
  amount: number;
  amountExternalCurrency: number;
  state: ExchangeQuotationState;
  gatewayName: string;
  props?: { [key: string]: string };
  provider?: Provider;
  system?: System;
  createdAt: Date;
}

export class ExchangeQuotationEntity implements ExchangeQuotation {
  id: string;
  quotationPspId: string;
  solicitationPspId: string;
  quotation: number;
  amount: number;
  amountExternalCurrency: number;
  state: ExchangeQuotationState;
  gatewayName: string;
  props?: { [key: string]: string };
  provider?: Provider;
  system?: System;
  createdAt: Date;

  constructor(props: Partial<ExchangeQuotation>) {
    Object.assign(this, props);
  }
}
