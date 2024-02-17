import { BankTed } from '@zro/banking/domain';

export type BankTedEvent = Pick<BankTed, 'id' | 'code'>;

export interface BankTedEventEmitter {
  /**
   * Call BankTeds microservice to emit BankTed.
   * @param event Data.
   */
  createdBankTed: (event: BankTedEvent) => void;

  /**
   * Call BankTeds microservice to emit BankTed.
   * @param event Data.
   */
  updatedBankTed: (event: BankTedEvent) => void;

  /**
   * Call BankTeds microservice to emit BankTed.
   * @param event Data.
   */
  deletedBankTed: (event: BankTedEvent) => void;
}
