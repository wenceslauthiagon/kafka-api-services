import { BankingCashInBillet } from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';

export interface BankingCashInBilletRepository {
  /**
   * Create a new BankingCashInBillet.
   * @param bankingCashInBillet BankingCashInBillet to save.
   * @returns Created BankingCashInBillet.
   */
  create: (
    bankingCashInBillet: BankingCashInBillet,
  ) => Promise<BankingCashInBillet>;

  /**
   * Update a BankingCashInBillet.
   * @param bankingCashInBillet BankingCashInBillet to update.
   * @returns Updated BankingCashInBillet.
   */
  update: (
    bankingCashInBillet: BankingCashInBillet,
  ) => Promise<BankingCashInBillet>;

  /**
   * Get BankingCashInBillet by ID.
   * @param id ID.
   * @returns The BankingCashInBillet found.
   */
  getById: (id: string) => Promise<BankingCashInBillet>;

  /**
   * Get BankingCashInBillet by Operation.
   * @param operation Operation.
   * @returns The BankingCashInBillet found.
   */
  getByOperation: (operation: Operation) => Promise<BankingCashInBillet>;
}
