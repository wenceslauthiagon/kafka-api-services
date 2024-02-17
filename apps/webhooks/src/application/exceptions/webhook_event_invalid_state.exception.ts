import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { WebhookEvent } from '@zro/webhooks/domain';

@Exception(ExceptionTypes.SYSTEM, 'WEBHOOK_EVENT_INVALID_STATE')
export class WebhookEventInvalidStateException extends DefaultException {
  constructor(webhookEvent: Partial<WebhookEvent>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'WEBHOOK_EVENT_INVALID_STATE',
      data: webhookEvent,
    });
  }
}
