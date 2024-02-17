import { Domain } from '@zro/common';

export interface Provider extends Domain<string> {
  name: string;
  description?: string;
  createdAt?: Date;
}

export class ProviderEntity implements Provider {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;

  constructor(props: Partial<Provider>) {
    Object.assign(this, props);
  }
}
