import { Domain } from '@zro/common';

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
  expiresAt: Date;
  updatedAt: Date;
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
  payload?: string;
  amount: number;
  currency?: string;
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;

  constructor(props: Partial<Checkout>) {
    Object.assign(this, props);
  }
}
