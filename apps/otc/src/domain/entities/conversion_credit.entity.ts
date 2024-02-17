import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

export interface ConversionCredit extends Domain<string> {
  liability: number;
  creditBalance: number;
  user: User;
}

export class ConversionCreditEntity implements ConversionCredit {
  liability: number;
  creditBalance: number;
  user: User;

  constructor(props: Partial<ConversionCredit>) {
    Object.assign(this, props);
  }
}
