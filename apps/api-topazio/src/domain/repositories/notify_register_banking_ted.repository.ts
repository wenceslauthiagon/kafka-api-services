import { NotifyRegisterBankingTed } from '@zro/api-topazio/domain';

export interface NotifyRegisterBankingTedRepository {
  /**
   * Insert a Notify.
   * @param notify Notify to save.
   * @returns Created notify register
   */
  create: (
    notifyRegister: NotifyRegisterBankingTed,
  ) => Promise<NotifyRegisterBankingTed>;
}
