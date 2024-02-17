import { Pagination, TPaginationResponse } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { Spread } from '@zro/otc/domain';
import { User } from '@zro/users/domain';

export interface SpreadRepository {
  /**
   * Insert a Spread.
   * @param spread Spread to save.
   * @returns Created spread.
   */
  create: (spread: Spread) => Promise<Spread>;

  /**
   * Delete Spreads by currency id.
   * @param currency Base currency.
   * @returns The number of deleted spreads.
   */
  deleteByCurrency: (currency: Currency) => Promise<number>;

  /**
   * Search by Spread ID.
   * @param id Spread ID.
   * @return Spread found.
   */
  getById: (id: string) => Promise<Spread>;

  /**
   * Search by Spread currency symbol.
   * @param currency Currency.
   * @return Spread found.
   */
  getByCurrency: (currency: Currency) => Promise<Spread>;

  /**
   * Search by Spread currency symbol and user id.
   * @param user User.
   * @param currency Currency.
   * @return Spread found.
   */
  getByUserAndCurrency: (user: User, currency: Currency) => Promise<Spread>;

  /**
   * List all Spread.
   * @return Spreads found.
   */
  getAll: (pagination: Pagination) => Promise<TPaginationResponse<Spread>>;
}
