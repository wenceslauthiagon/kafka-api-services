import { Domain } from '@zro/common';

export interface Summary extends Domain<string> {
  created: number;
  expired: number;
  authorized: number;
  paid: number;
  refunded: number;
  chargeback: number;
}

export class SummaryEntity implements Summary {
  created: number;
  expired: number;
  authorized: number;
  paid: number;
  refunded: number;
  chargeback: number;

  constructor(props: Partial<Summary>) {
    Object.assign(this, props);
  }
}
