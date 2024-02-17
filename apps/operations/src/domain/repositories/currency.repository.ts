import { Pagination, TPaginationResponse } from '@zro/common';
import { Currency, CurrencyState } from '@zro/operations/domain';

export type TGetCurrencyFilter = {
  id?: Currency['id'];
  title?: Currency['title'];
  symbol?: Currency['symbol'];
  symbolAlign?: Currency['symbolAlign'];
  tag?: Currency['tag'];
  decimal?: Currency['decimal'];
  state?: Currency['state'];
  type?: Currency['type'];
};

export interface CurrencyRepository {
  /**
   * Insert a Currency.
   * @param currency Currency to save.
   * @returns Created currency.
   */
  create: (currency: Currency) => Promise<Currency>;

  /**
   * Get currency by tag.
   *
   * @param tag Currency tag.
   * @returns Currency if found or null otherwise.
   */
  getByTag: (tag: string) => Promise<Currency>;

  /**
   * Get currency by id.
   *
   * @param id Currency id.
   * @returns Currency if found or null otherwise.
   */
  getById: (id: number) => Promise<Currency>;

  /**
   * Get currency by symbol.
   *
   * @param symbol Currency symbol.
   * @returns Currency if found or null otherwise.
   */
  getBySymbol: (symbol: string) => Promise<Currency>;

  /**
   * Get all currencies.
   *
   * @returns Currency list.
   */
  getAll: () => Promise<Currency[]>;

  /**
   * Get all currencies by filter.
   * @param pagination pagination params.
   * @param filter filter params.
   * @returns pagination response.
   */
  getByFilter: (
    pagination: Pagination,
    filter: TGetCurrencyFilter,
  ) => Promise<TPaginationResponse<Currency>>;

  /**
   * Get all currencies by state.
   *
   * @returns Currency list.
   */
  getAllByState: (state: CurrencyState) => Promise<Currency[]>;
}
