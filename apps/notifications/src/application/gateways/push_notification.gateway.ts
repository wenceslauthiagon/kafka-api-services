import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { BellNotification } from '@zro/notifications/domain';

export type PushNotificationMessage = Pick<
  BellNotification,
  'uuid' | 'title' | 'description' | 'type' | 'user' | 'read'
>;

export interface PushNotificationGateway {
  send(message: PushNotificationMessage): void | Promise<void>;
}

@Exception(ExceptionTypes.SYSTEM, 'PUSH_NOTIFICATION_GATEWAY')
export class PushNotificationGatewayException extends DefaultException {
  constructor(error?: Error) {
    super({
      message: 'Push notification gateway',
      type: ExceptionTypes.SYSTEM,
      code: 'PUSH_NOTIFICATION_GATEWAY',
      data: error,
    });
  }
}
