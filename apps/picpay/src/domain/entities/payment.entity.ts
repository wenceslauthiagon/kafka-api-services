import { Domain } from '@zro/common';
import { Buyer, Notification } from '@zro/picpay/domain';

export interface CreatePayment extends Domain<string> {
  checkoutId: string;
  referenceId: string;
  callbackUrl?: string;
  returnUrl?: string;
  value: number;
  expiresAt: Date;
  channel: string;
  purchaseMode: string;
  buyer: Buyer;
  notification: Notification;
  softDescriptor: string;
  autoCapture: boolean;
}

export class CreatePaymentEntity implements CreatePayment {
  checkoutId: string;
  referenceId: string;
  callbackUrl?: string;
  returnUrl?: string;
  value: number;
  expiresAt: Date;
  channel: string;
  purchaseMode: string;
  buyer: Buyer;
  notification: Notification;
  softDescriptor: string;
  autoCapture: boolean;

  constructor(props: Partial<CreatePayment>) {
    Object.assign(this, props);
    this.buyer = props.buyer;
    this.notification = props.notification;
  }
}
