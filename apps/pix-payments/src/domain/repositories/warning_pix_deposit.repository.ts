import { Pagination, TPaginationResponse } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import { WarningPixDeposit } from '@zro/pix-payments/domain';

export interface WarningPixDepositRepository {
  /**
   * Insert a Warning Pix Deposit.
   * @param warningPixDeposit Warning Pix Deposit to create.
   * @returns Created Warning Pix Deposit.
   */
  create: (warningPixDeposit: WarningPixDeposit) => Promise<WarningPixDeposit>;

  /**
   * Update a Warning Pix Deposit.
   * @param Warning Warning Pix Deposit to update.
   * @returns Updated Warning Pix Deposit.
   */
  update: (warningPixDeposit: WarningPixDeposit) => Promise<WarningPixDeposit>;

  /**
   * Search by Warning Pix Deposit ID.
   * @param id Warning Pix Deposit ID.
   * @return Warning Pix Deposit found.
   */
  getById: (id: string) => Promise<WarningPixDeposit>;

  /**
   * List all Warning Pix Deposits by filter.
   * @param pagination The pagination.
   * @param user Warning Pix Deposit's user id to be filtered.
   * @param transactionTag The transaction tag to be filtered.
   * @param operationId Warning Pix Deposit's operation id to be filtered.
   * @param createdAtPeriodStart Start created Warning Deposit date.
   * @param createdAtPeriodEnd End created Warning Deposit date.
   * @param updatedAtPeriodStart Start updated Warning Deposit date.
   * @param updatedAtPeriodEnd End updated Warning Deposit date.
   * @return Warning Pix Deposits found.
   */
  getAll: (
    pagination: Pagination,
    user?: User,
    transactionTag?: string,
    operationId?: string,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    updatedAtPeriodStart?: Date,
    updatedAtPeriodEnd?: Date,
  ) => Promise<TPaginationResponse<WarningPixDeposit>>;

  /**
   * Search by warning pix deposit operation ID.
   * @param operation Operation.
   * @return Warning Pix Deposit found.
   */
  getByOperation: (operation: Operation) => Promise<WarningPixDeposit>;
}
