import { BellNotification } from '@zro/notifications/domain';

export interface BellNotificationRepository {
  /**
   * Create bellNotification.
   *
   * @param bellNotification New bellNotification.
   * @returns Created bellNotification.
   */
  create(bellNotification: BellNotification): Promise<BellNotification>;

  /**
   * Update bellNotification.
   *
   * @param bellNotification New bellNotification.
   * @returns Updated bellNotification.
   */
  update(bellNotification: BellNotification): Promise<BellNotification>;

  /**
   * Get bellNotification by ID.
   *
   * @param uuid BellNotification ID
   * @returns BellNotification found or null otherwise.
   */
  getByUuid(uuid: string): Promise<BellNotification>;
}
