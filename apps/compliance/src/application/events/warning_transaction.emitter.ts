import { WarningTransaction } from '@zro/compliance/domain';

export type WarningTransactionEvent = Pick<WarningTransaction, 'id' | 'status'>;

export interface WarningTransactionEventEmitter {
  /**
   * Call compliance microservice to emit warning transaction pending creation.
   * @param event Data.
   */
  pendingWarningTransaction: (event: WarningTransactionEvent) => void;

  /**
   * Call compliance microservice to emit warning transaction sent creation.
   * @param event Data.
   */
  sentWarningTransaction: (event: WarningTransactionEvent) => void;

  /**
   * Call compliance microservice to emit closed warning transaction.
   * @param event Data.
   */
  closedWarningTransaction: (event: WarningTransactionEvent) => void;

  /**
   * Call compliance microservice to emit warning transaction failure.
   * @param event Data.
   */
  failedWarningTransaction: (event: WarningTransactionEvent) => void;

  /**
   * Call compliance microservice to emit expired warning transaction.
   * @param event Data.
   */
  expiredWarningTransaction: (event: WarningTransactionEvent) => void;
}
