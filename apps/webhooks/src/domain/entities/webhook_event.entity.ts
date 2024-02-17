import { Domain, getMoment } from '@zro/common';
import { Webhook, WebhookType } from './webhook.entity';

export enum WebhookEventState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

/**
 * WebhookEvent.
 */
export interface WebhookEvent extends Domain<string> {
  state: WebhookEventState;
  webhook: Webhook;
  targetUrl: string;
  apiKey: string;
  type: WebhookType;
  accountNumber: string;
  agencyNumber: string;
  httpStatusCodeResponse: string;
  data: Record<string, string | number | Date>;
  retryLimit: Date;
  lastRetry?: Date;
  createdAt: Date;
  updatedAt: Date;
  isInRetryLimit(): boolean;
}

export class WebhookEventEntity implements WebhookEvent {
  id: string;
  state: WebhookEventState;
  webhook: Webhook;
  apiKey: string;
  targetUrl: string;
  type: WebhookType;
  accountNumber: string;
  agencyNumber: string;
  httpStatusCodeResponse: string;
  data: Record<string, string | number | Date>;
  retryLimit: Date;
  lastRetry?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<WebhookEvent>) {
    Object.assign(this, props);
  }

  isInRetryLimit(): boolean {
    return getMoment().isBefore(this.retryLimit);
  }
}
