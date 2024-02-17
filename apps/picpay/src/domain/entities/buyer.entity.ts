import { Domain } from '@zro/common';
export interface Buyer extends Domain<string> {
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  phone: string;
}

export class BuyerEntity implements Buyer {
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  phone: string;

  constructor(props: Partial<Buyer>) {
    Object.assign(this, props);
  }
}
