import { FailedNotifyCredit } from '@zro/api-topazio/domain';

export interface FailedNotifyCreditRepository {
  /**
   * Insert a failed notify credit.
   * @param failedNotifyCredit Failed notify credit to save.
   * @returns Created failed notify credit.
   */
  create: (
    failedNotifyCredit: FailedNotifyCredit,
  ) => Promise<FailedNotifyCredit>;

  /**
   * Get by transaction ID.
   * @param transactionId Transaction ID.
   * @returns Failed notify credit found.
   */
  getByTransactionId: (transactionId: string) => Promise<FailedNotifyCredit>;
}
