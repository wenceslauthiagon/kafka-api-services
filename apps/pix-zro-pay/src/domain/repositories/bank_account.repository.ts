import { BankAccount } from '@zro/pix-zro-pay/domain';

export interface BankAccountRepository {
  /**
   * Insert a BankAccount.
   * @param bankAccount BankAccount to save.
   * @returns Created BankAccount.
   */
  create(bankAccount: BankAccount): Promise<BankAccount>;

  /**
   * Update a BankAccount.
   * @param bankAccount BankAccount to update.
   * @returns Updated bankAccount.
   */
  update(bankAccount: BankAccount): Promise<BankAccount>;

  /**
   * get a BankAccount by id.
   * @param id BankAccount id to get.
   * @returns get BankAccount.
   */
  getById(id: number): Promise<BankAccount>;
}
