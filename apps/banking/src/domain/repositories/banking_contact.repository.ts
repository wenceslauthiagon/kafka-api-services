import { User } from '@zro/users/domain';
import { BankingContact } from '@zro/banking/domain';
import { Pagination, TPaginationResponse } from '@zro/common';

export type TGetBankingContactFilter = {
  name?: string;
  document?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
};

export interface BankingContactRepository {
  /**
   * Create bankingContact.
   * @param bankingContact The bankingContact.
   * @returns The bankingContact created.
   */
  create: (bankingContact: BankingContact) => Promise<BankingContact>;

  /**
   * Search by BankingContact Filter, User with pagination.
   * @param user The user.
   * @param pagination Pagination.
   * @param filter TGetBankingContactFilter.
   * @return BankingContacts found.
   */
  getByFilterAndUserAndPagination(
    user: User,
    pagination: Pagination,
    filter: TGetBankingContactFilter,
  ): Promise<TPaginationResponse<BankingContact>>;

  /**
   * Get bankingContact by id.
   * @param id The bankingContact id.
   * @returns The bankingContact found.
   */
  getById: (id: number) => Promise<BankingContact>;

  /**
   * Get bankingContact by user.
   * @param user The user.
   * @param document The contact document.
   * @returns The bankingContact found.
   */
  getByUserAndDocument: (
    user: User,
    document: string,
  ) => Promise<BankingContact>;

  /**
   * Delete bankingContact.
   * @param bankingContact The bankingContact.
   * @returns The number of deleted bankingContact.
   */
  delete: (bankingContact: BankingContact) => Promise<number>;
}
