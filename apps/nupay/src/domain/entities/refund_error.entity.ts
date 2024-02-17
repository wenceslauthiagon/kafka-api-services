import { Domain } from '@zro/common';
import { RefundErrorTypeEnum } from './refund_error_type.enum';

export interface RefundError extends Domain<string> {
  type: RefundErrorTypeEnum;
  message: string;
  code?: string;
}

export class RefundErrorEntity implements RefundError {
  type: RefundErrorTypeEnum;
  message: string;
  code?: string;
  constructor(props: Partial<RefundError>) {
    Object.assign(this, props);
  }
}
