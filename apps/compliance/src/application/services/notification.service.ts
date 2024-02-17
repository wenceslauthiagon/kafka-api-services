import { BellNotification } from '@zro/notifications/domain';

import { CreateBellNotificationResponse } from '@zro/notifications/interface';

export interface BellNotificationService {
  /**
   * Create a bell notification.
   * @param {BellNotification} bellNotification data for construct bell notification.
   * @returns CreateBellNotificationResponse Bell Notification created.
   */
  create(
    bellNotification: BellNotification,
  ): Promise<CreateBellNotificationResponse>;
}
