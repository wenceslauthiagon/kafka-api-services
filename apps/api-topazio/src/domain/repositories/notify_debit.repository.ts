import { NotifyDebit } from '@zro/api-topazio/domain';

export interface NotifyDebitRepository {
  /**
   * Insert a Notify.
   * @param {NotifyDebit} notify Notify to save.
   * @returns {NotifyDebit} Created notify Debit.
   */
  create: (notifyDebit: NotifyDebit) => Promise<NotifyDebit>;
}
