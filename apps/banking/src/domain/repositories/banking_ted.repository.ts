import { BankingTed, BankingTedState } from '@zro/banking/domain';
import { Pagination, TPaginationResponse } from '@zro/common';
import { TGetConversionFilter } from '@zro/otc/domain';
import { Operation } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export type TGetBankingTedFilter = {
  operationId?: string;
  state?: BankingTedState;
  beneficiaryDocument?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  confirmedAtStart?: Date;
  confirmedAtEnd?: Date;
  failedAtStart?: Date;
  failedAtEnd?: Date;
};

export interface BankingTedRepository {
  /**
   * Insert a banking ted.
   * @param bankingTed BankingTed to save.
   * @returns Created bankingTed.
   */
  create(bankingTed: BankingTed): Promise<BankingTed>;

  /**
   * Update a banking ted.
   * @param bankingTed BankingTed to update.
   * @returns Updated bankingTed.
   */
  update(bankingTed: BankingTed): Promise<BankingTed>;

  /**
   * List all teds.
   * @return BankingTeds found.
   */
  getAll(): Promise<BankingTed[]>;

  /**
   * Get banking ted by id.
   * @param id The ted id.
   * @returns The ted found.
   */
  getById(id: number): Promise<BankingTed>;

  /**
   * Get banking ted by operationId.
   * @param operation The Operation.
   * @returns The ted found.
   */
  getByOperation(operation: Operation): Promise<BankingTed>;

  /**
   * Get banking ted by user and operation.
   * @param user The user.
   * @param operation The Operation.
   * @returns The ted found or null otherwise.
   */
  getByUserAndOperation(user: User, operation: Operation): Promise<BankingTed>;

  /**
   * Search by BankingTed Filter, User with pagination.
   * @param pagination BankingTed.
   * @param filter BankingTed.
   * @param user BankingTed.
   * @return BankingTed found.
   */
  getByFilterAndUserAndPagination(
    filter: TGetConversionFilter,
    user: User,
    pagination: Pagination,
  ): Promise<TPaginationResponse<BankingTed>>;

  /**
   * Get banking ted by transactionId.
   * @param transactionId The ted transactionId.
   * @returns The ted found.
   */
  getByTransactionId(transactionId: string): Promise<BankingTed>;
}
