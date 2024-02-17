import { Pagination, TPaginationResponse } from '@zro/common';
import { Provider } from '@zro/otc/domain';

export interface ProviderRepository {
  /**
   * Insert a Provider.
   * @param {Provider} provider Provider to save.
   * @returns {Provider} Created provider.
   */
  create: (provider: Provider) => Promise<Provider>;

  /**
   * Search by Provider ID.
   * @param {UUID} id Provider ID.
   * @return {Provider} Provider found.
   */
  getById: (id: string) => Promise<Provider>;

  /**
   * Search by Provider name.
   * @param {String} name Provider name.
   * @return {Provider} Provider found.
   */
  getByName: (name: string) => Promise<Provider>;

  /**
   * List all Provider.
   * @return {Provider[]} Providers found.
   */
  getAll: (pagination: Pagination) => Promise<TPaginationResponse<Provider>>;
}
