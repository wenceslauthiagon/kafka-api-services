import { Domain } from '@zro/common';
import { PersonType } from '@zro/users/domain';

export interface PixKeyDecodeLimit extends Domain<string> {
  limit: number;
  personType: PersonType;
  createdAt: Date;
  updatedAt: Date;
}

export class PixKeyDecodeLimitEntity implements PixKeyDecodeLimit {
  id: string;
  limit: number;
  personType: PersonType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<PixKeyDecodeLimit>) {
    Object.assign(this, props);
  }
}
