import { Pagination, TPaginationResponse } from '@zro/common';
import { BankTed } from '@zro/banking/domain';

export interface BankTedRepository {
  /**
   * Insert a bankTed.
   * @param {BankTed} bankTed BankTed to save.
   * @returns {BankTed} Created bankTed.
   */
  create: (bankTed: BankTed) => Promise<BankTed>;

  /**
   * Update a bankTed.
   * @param {BankTed} bankTed BankTed to update.
   * @returns {BankTed} Updated bankTed.
   */
  update: (bankTed: BankTed) => Promise<BankTed>;

  /**
   * Delete a bankTed.
   * @param {BankTed} bankTed BankTed to delete.
   * @returns {number} The number of deleted bankTed;
   */
  delete: (bankTed: BankTed) => Promise<number>;

  /**
   * List all bankTed.
   * @return {BankTed[]} BankTed found.
   */
  getAll: () => Promise<BankTed[]>;

  /**
   * List all bankTed include deleted.
   * @return {BankTed[]} BankTeds found.
   */
  getAllWithDeletedAt: () => Promise<BankTed[]>;

  /**
   * List all bankTed with pagination and
   * filtered by active flag and search by name and ispb.
   * @return {BankTed[]} BankTed found.
   */
  getBySearchAndActive: (
    pagination: Pagination,
    search?: string,
    active?: boolean,
  ) => Promise<TPaginationResponse<BankTed>>;

  /**
   * Get bankTed by id.
   * @param id The bankTed id.
   * @returns The bankTed found.
   */
  getById: (id: string) => Promise<BankTed>;
  /*
   * Gets a bankTed by its code code.
   * @param {code} code BankTed's code.
   * @returns {BankTed} The BankTed associated to the code;
   */
  getByCode: (code: string) => Promise<BankTed>;
}
