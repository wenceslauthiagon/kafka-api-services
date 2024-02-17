import { Domain } from '@zro/common';

export interface System extends Domain<string> {
  name: string;
  description?: string;
  createdAt?: Date;
}

export class SystemEntity implements System {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;

  constructor(props: Partial<System>) {
    Object.assign(this, props);
  }
}
