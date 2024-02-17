import { Bank } from '@zro/banking/domain';

export interface BankingService {
  /**
   * Get banking by id.
   * @param id.
   * @returns Banking.
   */
  getById(id: string): Promise<Bank>;
}
