import { Domain } from '@zro/common';

export interface Item extends Domain<string> {
  id: string;
  value: number;
  quantity: number;
  description: string;
  discount?: number;
  taxAmount?: number;
  amountExcludingTax?: number;
  amountIncludingTax?: number;
}

export class ItemEntity implements Item {
  id: string;
  value: number;
  quantity: number;
  description: string;
  discount?: number;
  taxAmount?: number;
  amountExcludingTax?: number;
  amountIncludingTax?: number;
  constructor(props: Partial<Item>) {
    Object.assign(this, props);
  }
}
