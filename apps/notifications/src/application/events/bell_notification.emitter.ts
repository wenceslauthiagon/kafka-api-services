import { BellNotification } from '@zro/notifications/domain';

export type BellNotificationEvent = Pick<
  BellNotification,
  'uuid' | 'title' | 'description' | 'type'
>;

/**
 * Emitter bell notification events.
 */

export interface BellNotificationEventEmitter {
  /**
   * Emit created bell notification event.
   * @param {BellNotificationEvent} event The created bell notification.
   */
  createdPushNotification: (event: BellNotificationEvent) => void;

  /**
   * Emit sent bell notification event.
   * @param {BellNotificationEvent} event The sent bell notification.
   */
  sentPushNotification: (event: BellNotificationEvent) => void;
}
