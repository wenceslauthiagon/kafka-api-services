import {
  PushNotificationGateway,
  PushNotificationMessage,
} from '@zro/notifications/application';
import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { FcmSendService } from '@zro/fcm/infrastructure';

export class FcmGateway implements PushNotificationGateway {
  constructor(
    private logger: Logger,
    private fcmSevice: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: FcmGateway.name,
    });
  }

  async send(message: PushNotificationMessage, logger?: Logger): Promise<void> {
    const gateway = new FcmSendService(this.logger, this.fcmSevice);
    return gateway.send(message, logger);
  }
}
