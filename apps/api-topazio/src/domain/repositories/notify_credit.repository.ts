import { NotifyCredit } from '@zro/api-topazio/domain';

export interface NotifyCreditRepository {
  /**
   * Insert a Notify.
   * @param {NotifyCredit} notify Notify to save.
   * @returns {NotifyCredit} Created notify Credit.
   */
  create: (notifyCredit: NotifyCredit) => Promise<NotifyCredit>;
}
