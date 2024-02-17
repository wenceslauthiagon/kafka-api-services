import { Domain } from '@zro/common';

export interface CheckoutHistoric extends Domain<string> {
  checkoutId: string;
  currentStatus: string;
  previousStatus: string;
  action: string;
  response: any;
  createdAt: Date;
  updatedAt: Date;
}

export class CheckoutHistoricEntity implements CheckoutHistoric {
  checkoutId: string;
  currentStatus: string;
  previousStatus: string;
  action: string;
  response: any;
  createdAt: Date;
  updatedAt: Date;
  constructor(props: Partial<CheckoutHistoric>) {
    Object.assign(this, props);
  }
}
