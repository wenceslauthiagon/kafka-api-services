import { NotifyCreditDeposit } from '@zro/api-jdpi/domain';

export interface NotifyCreditDepositRepository {
  /**
   * Creates a NotifyCreditDeposit.
   * @param notifyCreditDeposit NotifyCreditDeposit to save.
   * @returns Created NotifyCreditDeposit.
   */
  create: (
    notifyCreditDeposit: NotifyCreditDeposit,
  ) => Promise<NotifyCreditDeposit>;
}
