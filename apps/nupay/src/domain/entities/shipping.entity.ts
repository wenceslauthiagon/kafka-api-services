import { Domain } from '@zro/common';
import { Address } from './address.entity';

export interface Shipping extends Domain<string> {
  value?: number;
  company?: string;
  address?: Address;
}

export class ShippingEntity implements Shipping {
  value?: number;
  company?: string;
  address?: Address;
  constructor(props: Partial<Shipping>) {
    Object.assign(this, props);
  }
}
