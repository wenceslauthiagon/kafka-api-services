import { FailedNotifyCredit } from '@zro/api-jdpi/domain';

export interface FailedNotifyCreditRepository {
  /**
   * Creates a failed notify credit.
   * @param failedNotifyCredit FailedNotifyCredit to save.
   * @returns Created failed notify credit.
   */
  create: (
    failedNotifyCredit: FailedNotifyCredit,
  ) => Promise<FailedNotifyCredit>;
}
