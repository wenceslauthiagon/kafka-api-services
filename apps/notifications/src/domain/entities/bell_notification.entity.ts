import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';

/**
 * Bell notification message.
 */
export interface BellNotification extends Domain<number> {
  /**
   * Notification uuid.
   */
  uuid: string;

  /**
   * Description to send to user.
   */
  description: string;

  /**
   * Title to send to user.
   */
  title: string;

  /**
   *  Notification user.
   */
  user: User;

  /**
   * Notification type.
   */
  type: string;

  /**
   * Notification read flag.
   */
  read?: boolean;

  /**
   * Image to send to user.
   */
  image?: string;
}

export class BellNotificationEntity implements BellNotification {
  id: number;
  uuid: string;
  description: string;
  title: string;
  user: User;
  type: string;
  read?: boolean;
  image?: string;

  constructor(props: Partial<BellNotification>) {
    Object.assign(this, props);
  }
}
