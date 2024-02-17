import { Pagination, TPaginationResponse } from '@zro/common';
import { ExchangeContract } from '@zro/otc/domain';
import { File } from '@zro/storage/domain';

export type TGetIntervalFilters = {
  start: number;
  end: number;
};

export type TGetTimestampFilters = {
  start: Date;
  end: Date;
};

export type GetExchangeContractFilter = {
  exchangeContractIds?: string[];
  vetQuote?: TGetIntervalFilters;
  contractQuote?: TGetIntervalFilters;
  totalAmount?: TGetIntervalFilters;
  createdAt?: TGetTimestampFilters;
};

export interface ExchangeContractRepository {
  /**
   * Insert a Exchange Contract.
   * @param {ExchangeContract} exchangeContract Exchange Contract to save.
   * @returns {ExchangeContract} Created remittance.
   */
  create: (exchangeContract: ExchangeContract) => Promise<ExchangeContract>;

  /**
   * Update a Exchange Contract.
   * @param {ExchangeContract} remittance Exchange Contract to update.
   * @returns {ExchangeContract} Updated Exchange Contract.
   */
  update: (exchangeContract: ExchangeContract) => Promise<ExchangeContract>;

  /**
   * Search by Exchange Contract ID.
   * @param {UUID} id Exchange Contract ID.
   * @return {ExchangeContract} Exchange Contract found.
   */
  getById: (id: string) => Promise<ExchangeContract>;

  /**
   * Search by Exchange Contract ID.
   * @param {File} file Exchange Contract file ID.
   * @return {ExchangeContract} Exchange Contract found.
   */
  getByFileId: (file: File) => Promise<ExchangeContract>;

  /**
   * Search by Exchange Contract status.
   * @return {ExchangeContract[]} Exchange Contracts found.
   */
  getAll: (
    pagination: Pagination,
  ) => Promise<TPaginationResponse<ExchangeContract>>;

  /**
   * Search by Exchange Contract with filter params.
   * @param {GetExchangeContractFilter} filter filter.
   * @param {String} search? optional search param.
   * @return {ExchangeContract[]} Exchange Contracts found.
   */
  getAllByFilter: (
    filter: GetExchangeContractFilter,
    search?: string,
  ) => Promise<ExchangeContract[]>;

  /**
   * Search Exchange Contract by filter and pagination.
   * @param {Pagination} pagination pagination params.
   * @param {GetExchangeContractFilter} filter params.
   * @param {String} search? optional search param.
   * @return {ExchangeContract[]} Exchange Contracts found.
   */
  getAllByFilterAndPagination: (
    pagination: Pagination,
    filter: GetExchangeContractFilter,
    search?: string,
  ) => Promise<TPaginationResponse<ExchangeContract>>;
}
