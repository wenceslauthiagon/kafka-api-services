import { Pagination, TPaginationResponse } from '@zro/common';
import { Bank } from '@zro/banking/domain';

export interface BankRepository {
  /**
   * Insert a bank.
   * @param {Bank} bank Bank to save.
   * @returns {Bank} Created bank.
   */
  create: (bank: Bank) => Promise<Bank>;

  /**
   * Update a bank.
   * @param {Bank} bank Bank to update.
   * @returns {Bank} Updated bank.
   */
  update: (bank: Bank) => Promise<Bank>;

  /**
   * Delete a bank.
   * @param {Bank} bank Bank to delete.
   * @returns {number} The number of deleted banks;
   */
  delete: (bank: Bank) => Promise<number>;

  /**
   * List all banks.
   * @return {Bank[]} Banks found.
   */
  getAll: () => Promise<Bank[]>;

  /**
   * List all banks include deleted.
   * @return {Bank[]} Banks found.
   */
  getAllWithDeletedAt: () => Promise<Bank[]>;

  /**
   * List all banks with pagination and
   * filtered by active flag and search by name and ispb.
   * @return {Bank[]} Banks found.
   */
  getBySearchAndActive: (
    pagination: Pagination,
    search?: string,
    active?: boolean,
  ) => Promise<TPaginationResponse<Bank>>;

  /**
   * Get bank by id.
   * @param id The bank id.
   * @returns The bank found.
   */
  getById: (id: string) => Promise<Bank>;
  /*
   * Gets a bank by its ispb code.
   * @param {ispb} ispb Bank's ispb.
   * @returns {Bank} The Bank associated to the ispb;
   */
  getByIspb: (ispb: string) => Promise<Bank>;
}
