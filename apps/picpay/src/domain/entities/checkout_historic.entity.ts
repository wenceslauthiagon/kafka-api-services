import { Domain } from '@zro/common';

export interface CheckoutHistoric extends Domain<string> {
  id: string;
  checkoutId: string;
  currentStatus: string;
  previousStatus: string;
  action: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CheckoutHistoricEntity implements CheckoutHistoric {
  id: string;
  checkoutId: string;
  currentStatus: string;
  previousStatus: string;
  action: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
  constructor(props: Partial<CheckoutHistoric>) {
    Object.assign(this, props);
  }
}
