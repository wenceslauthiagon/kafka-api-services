import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class GatewayWebhookException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'GATEWAY_WEBHOOK_ERROR',
      data: error?.data ?? error,
    });
  }
}

export class OfflineGatewayWebhookException extends GatewayWebhookException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'GATEWAY_WEBHOOK_OFFLINE',
      data: error,
    });
  }
}
