import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { Webhook } from '@zro/webhooks/domain';

@Exception(ExceptionTypes.SYSTEM, 'WEBHOOK_NOT_FOUND')
export class WebhookNotFoundException extends DefaultException {
  constructor(data: Partial<Webhook>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'WEBHOOK_NOT_FOUND',
      data,
    });
  }
}
