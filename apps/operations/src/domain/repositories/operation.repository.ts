import { Pagination, TPaginationResponse } from '@zro/common';
import {
  Currency,
  Operation,
  OperationAnalysisTag,
  OperationState,
  TransactionType,
  WalletAccount,
} from '@zro/operations/domain';

export type RangeFilter<T> = { start: T; end: T };

export type TGetOperationsFilter = {
  currencySymbol?: Currency['symbol'];
  currencyTag?: Currency['tag'];
  transactionTag?: TransactionType['tag'];
  createdAtStart?: Date;
  createdAtEnd?: Date;
  nonChargeback?: boolean;
  currencyId?: Currency['id'];
  value?: number;
  states?: OperationState[];
};

export type TGetAllOperationsGeneratorFilter = {
  transactionTag: TransactionType['tag'];
  createdAtStart: Date;
  createdAtEnd: Date;
  nonChargeback: boolean;
  currencyId: Currency['id'];
};

export enum OperationRequestSort {
  CREATED_AT = 'created_at',
}

export interface OperationRepository {
  /**
   * Create operation.
   *
   * @param operation New operation.
   * @returns Created operation.
   */
  create: (operation: Operation) => Promise<Operation>;

  /**
   * Update operation.
   *
   * @param operation The operation.
   * @returns Updated operation.
   */
  update: (operation: Operation) => Promise<Operation>;

  /**
   * Get operation by ID.
   * @param id Operation UUID.
   * @returns Operation found or null otherwise.
   */
  getById: (id: string) => Promise<Operation>;

  /**
   * Get operation by ID with transactionType.
   * @param id Operation UUID.
   * @returns Operation found or null otherwise.
   */
  getWithTransactionTypeById: (id: string) => Promise<Operation>;

  /**
   * Get operations by owner wallet account and created after day.
   *
   * @param walletAccount Owner wallet account.
   * @param date Date for search operations.
   * @param transactionTypes Transaction types.
   * @returns Operations list if found or empty list otherwise.
   */
  getValueAndCreatedAtByOwnerWalletAccountAndCreatedAtAfterAndTransactionTypeAndStateIn: (
    walletAccount: WalletAccount,
    date: string,
    transactionTypes: TransactionType[],
    states: OperationState[],
  ) => Promise<Operation[]>;

  /**
   * Get operations by beneficiary wallet account and created after day.
   *
   * @param walletAccount Beneficiary wallet account.
   * @param date Date for search operations.
   * @param transactionTypes Transaction types.
   * @returns Operations list if found or empty list otherwise.
   */
  getValueAndCreatedAtByBeneficiaryWalletAccountAndCreatedAtAfterAndTransactionTypeAndStateIn: (
    walletAccount: WalletAccount,
    date: string,
    transactionTypes: TransactionType[],
    states: OperationState[],
  ) => Promise<Operation[]>;

  /**
   * Get all operations by wallet accounts and filter.
   * @param walletAccounts WalletAccounts[].
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns Operations[]
   */
  getAllByWalletAccountsAndFilter: (
    walletAccounts: WalletAccount[],
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ) => Promise<TPaginationResponse<Operation>>;

  /**
   * Get operations by wallet accounts and id.
   * @param walletAccounts WalletAccounts[].
   * @param id Operation id.
   * @returns Operations if found or null otherwise.
   */
  getByWalletAccountsAndId: (
    walletAccounts: WalletAccount[],
    id: Operation['id'],
  ) => Promise<Operation>;

  /**
   * Get all operations by  filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns Operations[]
   */
  getAllByFilter: (
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ) => Promise<TPaginationResponse<Operation>>;

  /**
   * Get all operations by filter using async generator function.
   * @param filter Filter.
   * @returns Operation[]
   */
  getAllByFilterGenerator: (
    filter: TGetAllOperationsGeneratorFilter,
  ) => AsyncGenerator<Operation[]>;

  /**
   * Get all operations by analysis tag.
   * @param pagination Pagination.
   * @param analysisTag Analysis tag.
   * @param date Before the date.
   * @returns Operation[]
   */
  getAllByPaginationAndAnalysisTagBeforeDate: (
    pagination: Pagination,
    analysisTag: OperationAnalysisTag,
    date: Date,
  ) => Promise<TPaginationResponse<Operation>>;

  /**
   * Update operation analysis tags.
   *
   * @param operation Operation to be updated.
   * @returns Updated operation.
   */
  updateAnalysisTags: (
    operation: Partial<Operation>,
  ) => Promise<Partial<Operation>>;
}
