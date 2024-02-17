import { Domain } from '@zro/common';

export interface Retry extends Domain<string> {
  counter: number;
  retryQueue: string;
  failQueue: string;
  retryAt: Date;
  abortAt: Date;
  data: unknown;
}

export class RetryEntity implements Retry {
  id: string;
  counter: number;
  retryQueue: string;
  failQueue: string;
  retryAt: Date;
  abortAt: Date;
  data: unknown;

  constructor(props: Partial<Retry>) {
    Object.assign(this, props);
  }
}
