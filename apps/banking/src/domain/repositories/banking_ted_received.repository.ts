import { BankingTedReceived } from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';

export interface BankingTedReceivedRepository {
  /**
   * Insert a banking ted received.
   * @param bankingTedReceived BankingTedReceived to save.
   * @returns Created bankingTedReceived.
   */
  create(bankingTedReceived: BankingTedReceived): Promise<BankingTedReceived>;

  /**
   * Update a banking ted received.
   * @param bankingTedReceived BankingTedReceived to update.
   * @returns Updated bankingTedReceived.
   */
  update(bankingTedReceived: BankingTedReceived): Promise<BankingTedReceived>;

  /**
   * List all teds.
   * @return BankingTedReceiveds found.
   */
  getAll(): Promise<BankingTedReceived[]>;

  /**
   * Get banking ted received by id.
   * @param id The ted id.
   * @returns The ted found.
   */
  getById(id: number): Promise<BankingTedReceived>;

  /**
   * Get banking ted received by operationId.
   * @param operation The Operation.
   * @returns The ted found.
   */
  getByOperation(operation: Operation): Promise<BankingTedReceived>;
}
