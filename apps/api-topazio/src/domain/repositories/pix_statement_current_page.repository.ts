import { PixStatementCurrentPage } from '@zro/api-topazio/domain';

export interface PixStatementCurrentPageRepository {
  /**
   * CreateOrUpdate pix statement current page.
   *
   * @param pixStatementCurrentPage New pixStatementCurrentPage.
   * @returns Created or Updated pixStatementCurrentPage.
   */
  createOrUpdate: (
    pixStatementCurrentPage: PixStatementCurrentPage,
  ) => Promise<void>;

  /**
   * Get current page.
   * @param date
   * @returns PixStatementCurrentPage found or null otherwise.
   */
  getCurrentPage: () => Promise<PixStatementCurrentPage>;
}
