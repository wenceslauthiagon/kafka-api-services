import { NotifyConfirmBankingTed } from '@zro/api-topazio/domain';

export interface NotifyConfirmBankingTedRepository {
  /**
   * Insert a Notify.
   * @param notify Notify to save.
   * @returns Created notify confirm.
   */
  create: (
    notifyConfirm: NotifyConfirmBankingTed,
  ) => Promise<NotifyConfirmBankingTed>;
}
