import { Bank } from '@zro/banking/domain';

export type BankEvent = Pick<Bank, 'id' | 'ispb'>;

export interface BankEventEmitter {
  /**
   * Call Banks microservice to emit Bank.
   * @param event Data.
   */
  createdBank: (event: BankEvent) => void;

  /**
   * Call Banks microservice to emit Bank.
   * @param event Data.
   */
  updatedBank: (event: BankEvent) => void;

  /**
   * Call Banks microservice to emit Bank.
   * @param event Data.
   */
  deletedBank: (event: BankEvent) => void;
}
