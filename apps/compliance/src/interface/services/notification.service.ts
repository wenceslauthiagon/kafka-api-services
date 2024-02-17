import {
  CreateBellNotificationRequest,
  CreateBellNotificationResponse,
} from '@zro/notifications/interface';

export interface NotificationService {
  createBellNotification(
    createBellNotificationRequest: CreateBellNotificationRequest,
  ): Promise<CreateBellNotificationResponse>;
}
