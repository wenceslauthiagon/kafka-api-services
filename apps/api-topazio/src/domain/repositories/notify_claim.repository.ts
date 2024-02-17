import { NotifyClaim } from '@zro/api-topazio/domain';

export interface NotifyClaimRepository {
  /**
   * Insert a Notify.
   * @param {NotifyClaim} pixKey Notify to save.
   * @returns {NotifyClaim} Created notify claim.
   */
  create: (notifyClaim: NotifyClaim) => Promise<NotifyClaim>;
}
