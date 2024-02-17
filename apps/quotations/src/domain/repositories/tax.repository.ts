import { Pagination, PaginationResponse } from '@zro/common';
import { Tax } from '@zro/quotations/domain';

export type GetTaxFilter = {
  name?: string;
};

export interface TaxRepository {
  /**
   * Insert a Tax.
   * @param Tax Tax to save.
   * @returns Created Tax.
   */
  create: (Tax: Tax) => Promise<Tax>;

  /**
   * Search by Tax ID.
   * @param id Tax ID.
   * @return Tax found.
   */
  getById: (id: string) => Promise<Tax>;

  /**
   * List all Taxes.
   * @return Taxes found.
   */
  getAllByFilterAndPagination: (
    pagination: Pagination,
    filter: GetTaxFilter,
  ) => Promise<PaginationResponse<Tax>>;

  /**
   * Search by Tax name.
   * @param name Tax name.
   * @return Tax found.
   */
  getByName: (name: string) => Promise<Tax>;
}
