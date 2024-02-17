import { Domain } from '@zro/common';
import { Details } from './details.entity';

export interface Amount extends Domain<string> {
  value: number;
  currency: string;
  details?: Details;
}

export class AmountEntity implements Amount {
  value: number;
  currency: string;
  details?: Details;
  constructor(props: Partial<Amount>) {
    Object.assign(this, props);
  }
}
