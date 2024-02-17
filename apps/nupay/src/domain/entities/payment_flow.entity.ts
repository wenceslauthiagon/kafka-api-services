import { Domain } from '@zro/common';

export interface PaymentFlow extends Domain<string> {
  returnUrl?: string;
  cancelUrl?: string;
}

export class PaymentFlowEntity implements PaymentFlow {
  returnUrl?: string;
  cancelUrl?: string;
  constructor(props: Partial<PaymentFlow>) {
    Object.assign(this, props);
  }
}
