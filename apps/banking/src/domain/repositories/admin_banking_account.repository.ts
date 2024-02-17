import { Pagination, TPaginationResponse } from '@zro/common';
import { AdminBankingAccount } from '@zro/banking/domain';

export type TGetAdminBankingAccountFilter = {
  branchNumber?: string;
  accountNumber?: string;
  accountDigit?: string;
  bankName?: string;
  bankCode?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
};

export interface AdminBankingAccountRepository {
  /**
   * Get bankTed by id.
   * @param id The bankTed id.
   * @returns The bankTed found.
   */
  getById: (id: string) => Promise<AdminBankingAccount>;

  /**
   * Search by AdminBankingAccount filter and pagination.
   * @param pagination Pagination.
   * @param filter filters.
   * @returns The adminBankingAccounts found.
   */
  getByFilterAndPagination: (
    filter: TGetAdminBankingAccountFilter,
    pagination: Pagination,
  ) => Promise<TPaginationResponse<AdminBankingAccount>>;
}
