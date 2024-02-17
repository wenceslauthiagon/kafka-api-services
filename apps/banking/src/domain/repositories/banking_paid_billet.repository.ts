import { BankingPaidBillet } from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';

export interface BankingPaidBilletRepository {
  /**
   * Create a new BankingPaidBillet.
   * @param bankingPaidBillet BankingPaidBillet to save.
   * @returns Created BankingPaidBillet.
   */
  create: (bankingPaidBillet: BankingPaidBillet) => Promise<BankingPaidBillet>;

  /**
   * Update a BankingPaidBillet.
   * @param bankingPaidBillet BankingPaidBillet to update.
   * @returns Updated BankingPaidBillet.
   */
  update: (bankingPaidBillet: BankingPaidBillet) => Promise<BankingPaidBillet>;

  /**
   * Get BankingPaidBillet by ID.
   * @param id ID.
   * @returns The BankingPaidBillet found.
   */
  getById: (id: string) => Promise<BankingPaidBillet>;

  /**
   * Get BankingPaidBillet by Operation.
   * @param operation Operation.
   * @returns The BankingPaidBillet found.
   */
  getByOperation: (operation: Operation) => Promise<BankingPaidBillet>;
}
