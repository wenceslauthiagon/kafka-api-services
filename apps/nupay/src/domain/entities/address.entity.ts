import { Domain } from '@zro/common';

export interface Address extends Domain<string> {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  complement?: string;
  neighborhood?: string;
}

export class AddressEntity implements Address {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  complement?: string;
  neighborhood?: string;
  constructor(props: Partial<Address>) {
    Object.assign(this, props);
  }
}
