import { Domain } from '@zro/common';
import { CheckoutHistoric, CheckoutHistoricEntity } from '@zro/cielo/domain';

export interface Checkout extends Domain<string> {
  id: string;
  status: string;
  referenceId?: string;
  authorizationId?: string;
  destination: string;
  requesterName: string;
  requesterDocument: string;
  requesterContact: string;
  payload?: any;
  amount: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  historic?: CheckoutHistoric[];
}

export class CheckoutEntity implements Checkout {
  id: string;
  status: string;
  referenceId?: string;
  authorizationId?: string;
  destination: string;
  requesterName: string;
  requesterDocument: string;
  requesterContact: string;
  payload?: any;
  amount: number;
  currency?: string;
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
  historic?: CheckoutHistoricEntity[];
  constructor(props: Partial<Checkout>) {
    Object.assign(this, props);
  }
}
