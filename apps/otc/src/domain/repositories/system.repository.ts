import { Pagination, TPaginationResponse } from '@zro/common';
import { System } from '@zro/otc/domain';

export interface SystemRepository {
  /**
   * Insert a System.
   * @param {System} system System to save.
   * @returns {System} Created system.
   */
  create: (system: System) => Promise<System>;

  /**
   * Search by System ID.
   * @param {UUID} id System ID.
   * @return {System} System found.
   */
  getById: (id: string) => Promise<System>;

  /**
   * Search by System name.
   * @param {String} name System name.
   * @return {System} System found.
   */
  getByName: (name: string) => Promise<System>;

  /**
   * List all System.
   * @return {System[]} Systems found.
   */
  getAll: (pagination: Pagination) => Promise<TPaginationResponse<System>>;
}
