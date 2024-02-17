import { UserLimitRequest } from '@zro/compliance/domain';

export type UserLimitRequestEvent = Pick<
  UserLimitRequest,
  'id' | 'status' | 'state' | 'user'
>;

export interface UserLimitRequestEventEmitter {
  /**
   * Emit open pending user limit request event.
   * @param event event to fire.
   */
  openPending: (event: UserLimitRequestEvent) => void;

  /**
   * Emit open confirmed user limit request event.
   * @param event event to fire.
   */
  openConfirmed: (event: UserLimitRequestEvent) => void;

  /**
   * Emit approved user limit request event.
   * @param event event to fire.
   */
  closedConfirmedApproved: (event: UserLimitRequestEvent) => void;

  /**
   * Emit rejected user limit request event.
   * @param event event to fire.
   */
  closedConfirmedRejected: (event: UserLimitRequestEvent) => void;
}
