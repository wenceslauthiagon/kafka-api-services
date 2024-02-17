import { Domain } from '@zro/common';

export interface Phone extends Domain<string> {
  country: string;
  number: string;
}

export class PhoneEntity implements Phone {
  country: string;
  number: string;
  constructor(props: Partial<Phone>) {
    Object.assign(this, props);
  }
}
