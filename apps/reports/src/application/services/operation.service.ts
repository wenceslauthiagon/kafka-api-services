import { Pagination, TPaginationResponse } from '@zro/common';
import {
  Currency,
  Operation,
  TGetOperationsFilter,
  TransactionType,
  UserLimit,
  WalletAccount,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export type GetOperationByIdResponse = Pick<
  Operation,
  'id' | 'state' | 'value'
>;
export interface OperationService {
  /**
   * Get an operation by id.
   * @param id operation id.
   * @returns operation found otherwise null.
   */
  getOperationById(id: string): Promise<Operation>;

  /**
   * Get a transaction type by tag.
   * @param tag transaction type tag.
   * @returns transaction type found or null otherwise.
   */
  getTransactionTypeByTag(tag: string): Promise<TransactionType>;

  /**
   * Get Currency by tag.
   * @param tag The Currency's tag.
   * @returns Currency if found or null otherwise.
   */
  getCurrencyByTag(tag: string): Promise<Currency>;

  /**
   * Get all users limits.
   * @param user the user.
   * @returns User limits found.
   */
  getAllUserLimits(user: User): Promise<UserLimit[]>;

  /**
   * Get Wallet Account by User and Currency.
   * @param user User.
   * @param currency Currency.
   * @returns Wallet Account found or null otherwise.
   */
  getWalletAccountByUserAndCurrency(
    user: User,
    currency: Currency,
  ): Promise<WalletAccount>;

  /**
   * Get all operations by filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns The Operations found or null otherwise.
   */
  getAllOperationsByFilter(
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ): Promise<TPaginationResponse<Operation>>;
}
