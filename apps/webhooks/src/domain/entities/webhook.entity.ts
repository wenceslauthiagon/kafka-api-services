import { Domain } from '@zro/common';

export enum WebhookType {
  DEVOLUTION_RECEIVED = 'DEVOLUTION_RECEIVED',
  DEVOLUTION_COMPLETED = 'DEVOLUTION_COMPLETED',
  DEVOLUTION_FAILED = 'DEVOLUTION_FAILED',
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum WebhookState {
  ACTIVE = 'ACTIVE',
  DEACTIVATE = 'DEACTIVATE',
}

/**
 * Webhook.
 */
export interface Webhook extends Domain<string> {
  targetUrl: string;
  type: WebhookType;
  accountNumber: string;
  agencyNumber: string;
  userId: string;
  apiKey: string;
  state: WebhookState;
  createdAt: Date;
  updatedAt: Date;
}

export class WebhookEntity implements Webhook {
  id: string;
  targetUrl: string;
  type: WebhookType;
  accountNumber: string;
  agencyNumber: string;
  userId: string;
  apiKey: string;
  state: WebhookState;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<Webhook>) {
    Object.assign(this, props);
  }
}
