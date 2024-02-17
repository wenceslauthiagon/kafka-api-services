import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { WebhookEvent } from '@zro/webhooks/domain';

@Exception(ExceptionTypes.SYSTEM, 'WEBHOOK_EVENT_NOT_FOUND')
export class WebhookEventNotFoundException extends DefaultException {
  constructor(data: Partial<WebhookEvent>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'WEBHOOK_EVENT_NOT_FOUND',
      data,
    });
  }
}
