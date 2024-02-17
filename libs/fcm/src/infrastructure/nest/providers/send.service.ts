import { AxiosInstance } from 'axios';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PushNotificationMessage,
  PushNotificationGatewayException,
} from '@zro/notifications/application';
import { FCM_API } from './service.contants';

export interface FCMSendMessageRequest {
  message: {
    token: string;
    notification: {
      title: string;
      body: string;
    };
  };
}

export class FcmSendService {
  constructor(
    private logger: Logger,
    private axios: AxiosInstance,
  ) {
    this.logger = logger.child({
      context: FcmSendService.name,
    });
  }
  async send(message: PushNotificationMessage, logger?: Logger): Promise<void> {
    logger = logger?.child({ context: FcmSendService.name }) ?? this.logger;

    const { fcmToken } = message.user;

    const { uuid, type, title, description } = message;

    if (!uuid || !title || !description || !type || !fcmToken) {
      throw new MissingDataException([
        ...(!uuid ? ['UUID'] : []),
        ...(!title ? ['Title'] : []),
        ...(!description ? ['Description'] : []),
        ...(!type ? ['Type'] : []),
        ...(!fcmToken ? ['FCM Token'] : []),
      ]);
    }

    logger.info('Sending push notification via FCM', {
      uuid,
      title,
      description,
      type,
    });

    const request: FCMSendMessageRequest = {
      message: {
        token: fcmToken,
        notification: {
          title,
          body: description,
        },
      },
    };

    try {
      await this.axios.post(FCM_API.SEND, request);

      logger.info('Message sent via fcm', { fcmToken });
    } catch (error) {
      logger.error('Failed to sent via fcm', {
        token: fcmToken,
        response: error?.message,
      });
      throw new PushNotificationGatewayException(error);
    }
  }
}
