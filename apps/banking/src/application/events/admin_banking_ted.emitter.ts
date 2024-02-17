import { AdminBankingTed } from '@zro/banking/domain';

export type AdminBankingTedEvent = Pick<AdminBankingTed, 'id' | 'state'>;

export interface AdminBankingTedEventEmitter {
  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingAdminBankingTed: (event: AdminBankingTedEvent) => void;

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingAdminBankingTed: (event: AdminBankingTedEvent) => void;

  /**
   * Emit forwarded event.
   * @param event Data.
   */
  forwardedAdminBankingTed: (event: AdminBankingTedEvent) => void;

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedAdminBankingTed: (event: AdminBankingTedEvent) => void;

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedAdminBankingTed: (event: AdminBankingTedEvent) => void;
}
