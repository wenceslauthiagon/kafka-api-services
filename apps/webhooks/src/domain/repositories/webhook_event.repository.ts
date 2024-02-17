import { WebhookEvent } from '@zro/webhooks/domain';

export interface WebhookEventRepository {
  /**
   * Insert a WebhookEvent.
   * @param {WebhookEvent} WebhookEvent WebhookEvent to save.
   * @returns {WebhookEvent} Created WebhookEvent.
   */
  create: (webhookEvent: WebhookEvent) => Promise<WebhookEvent>;

  /**
   * Search by Webhook Event ID.
   * @param {UUID} id Webhook Event ID.
   * @return {WebhookEvent} Webhook Event found or null otherwise.
   */
  getById: (id: string) => Promise<WebhookEvent>;

  /**
   * Update a Webhook event.
   * @param {WebhookEvent} WebhookEvent Webhook Event to update.
   * @returns {WebhookEvent} Updated Webhook Event.
   */
  update: (webhook: WebhookEvent) => Promise<WebhookEvent>;
}
