import { Pagination, TPaginationResponse } from '@zro/common';
import { LimitType, TransactionType } from '@zro/operations/domain';

export interface LimitTypeFilter {
  tag?: LimitType['tag'];
  transactionTypeTag?: TransactionType['tag'];
}

export interface LimitTypeRepository {
  /**
   * Get limit type by transaction type.
   * @param transactionType Transaction type.
   * @returns Limit type if found or null otherwise.
   */
  getByTransactionType: (
    transactionType: TransactionType,
  ) => Promise<LimitType>;

  /**
   * Get limit type by  id.
   * @param id Limit type id.
   * @returns Limit type if found or null otherwise.
   */
  getById: (id: number) => Promise<LimitType>;

  /**
   * Get limit types by filter.
   *
   * @param filter filter.
   * @param pagination Pagination
   * @returns Limit types found.
   */
  getByFilter: (
    filter: LimitTypeFilter,
    pagination: Pagination,
  ) => Promise<TPaginationResponse<LimitType>>;

  /**
   * Get all limit types.
   *
   * @returns Limit types found.
   */
  getAll: () => Promise<LimitType[]>;
}
