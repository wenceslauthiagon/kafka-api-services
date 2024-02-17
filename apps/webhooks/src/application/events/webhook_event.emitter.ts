import { WebhookEvent } from '@zro/webhooks/domain';

export type WebhookEventPayload = Pick<WebhookEvent, 'id' | 'state'>;

export interface WebhookEventEmitter {
  /**
   * Emit created event.
   * @param event Data.
   */
  created: (event: WebhookEventPayload) => void;

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmed: (event: WebhookEventPayload) => void;
}
