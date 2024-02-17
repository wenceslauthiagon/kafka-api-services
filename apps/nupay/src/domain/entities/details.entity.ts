import { Domain } from '@zro/common';

export interface Details extends Domain<string> {
  taxValue: number;
}

export class DetailsEntity implements Details {
  taxValue: number;
  constructor(props: Partial<Details>) {
    Object.assign(this, props);
  }
}
