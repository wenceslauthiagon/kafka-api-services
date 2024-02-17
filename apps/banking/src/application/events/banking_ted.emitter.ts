import { BankingTed } from '@zro/banking/domain';
import { Wallet } from '@zro/operations/domain';

export type BankingTedEvent = Pick<BankingTed, 'id' | 'state' | 'user'> & {
  wallet?: Wallet;
};

export interface BankingTedEventEmitter {
  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingBankingTed: (event: BankingTedEvent) => void;

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingBankingTed: (event: BankingTedEvent) => void;

  /**
   * Emit forwarded event.
   * @param event Data.
   */
  forwardedBankingTed: (event: BankingTedEvent) => void;

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedBankingTed: (event: BankingTedEvent) => void;

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedBankingTed: (event: BankingTedEvent) => void;
}
