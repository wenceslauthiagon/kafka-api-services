import { Pagination, TPaginationResponse } from '@zro/common';
import { AdminBankingTed, AdminBankingTedState } from '@zro/banking/domain';

export type TGetAdminBankingTedFilter = {
  sourceId?: string;
  destinationId?: string;
  state?: AdminBankingTedState;
  transactionId?: string;
  confirmedAtStart?: Date;
  confirmedAtEnd?: Date;
  failedAtStart?: Date;
  failedAtEnd?: Date;
  createdAtStart?: Date;
  createdAtEnd?: Date;
};

export interface AdminBankingTedRepository {
  /**
   * Insert a adminBankingTed.
   * @param {AdminBankingTed} adminBankingTed AdminBankingTed to save.
   * @returns {AdminBankingTed} Created adminBankingTed.
   */
  create: (adminBankingTed: AdminBankingTed) => Promise<AdminBankingTed>;

  /**
   * Update a adminBankingTed.
   * @param {AdminBankingTed} adminBankingTed AdminBankingTed to update.
   * @returns {AdminBankingTed} Updated adminBankingTed.
   */
  update: (adminBankingTed: AdminBankingTed) => Promise<AdminBankingTed>;

  /**
   * Get adminBankingTed by id.
   * @param id The adminBankingTed id.
   * @returns The adminBankingTed found.
   */
  getById: (id: string) => Promise<AdminBankingTed>;

  /**
   * Get adminBankingTed by transactionId.
   * @param transactionId The adminBankingTed transactionId.
   * @returns The adminBankingTed found.
   */
  getByTransactionId: (transactionId: string) => Promise<AdminBankingTed>;

  /**
   * Search by AdminBankingTed filter and pagination.
   * @param pagination Pagination.
   * @param filter filters.
   * @returns The adminBankingTeds found.
   */
  getByFilterAndPagination: (
    filter: TGetAdminBankingTedFilter,
    pagination: Pagination,
  ) => Promise<TPaginationResponse<AdminBankingTed>>;
}
