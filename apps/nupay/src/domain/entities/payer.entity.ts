import { Domain } from '@zro/common';

export interface Payer extends Domain<string> {
  id: string;
}

export class PayerEntity implements Payer {
  id: string;
  constructor(props: Partial<Payer>) {
    Object.assign(this, props);
  }
}
