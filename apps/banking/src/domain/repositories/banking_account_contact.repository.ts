import { BankingContact, BankingAccountContact } from '@zro/banking/domain';

export interface BankingAccountContactRepository {
  /**
   * Create bankingAccountContact.
   * @param bankingAccountContact The bankingAccountContact to create.
   * @returns The bankingAccountContact created.
   */
  create: (
    bankingAccountContact: BankingAccountContact,
  ) => Promise<BankingAccountContact>;

  /**
   * Get bankingAccountContact by id.
   * @param id The bankingAccountContact id.
   * @returns The bankingAccountContact found.
   */
  getById: (id: number) => Promise<BankingAccountContact>;

  /**
   * Get bankingAccountContact by bankingContact.
   * @param bankingContact The bankingContact.
   * @returns The bankingAccountContact found.
   */
  getByBankingContact: (
    bankingContact: BankingContact,
  ) => Promise<BankingAccountContact[]>;

  /**
   * Delete bankingAccountContact by id.
   * @param id The bankingAccountContact id.
   * @returns The number of deleted bankingAccountContact;
   */
  delete: (bankingAccountContact: BankingAccountContact) => Promise<number>;
}
