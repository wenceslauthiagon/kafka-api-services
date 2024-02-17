import { CryptoReportCurrentPage } from '@zro/otc/domain';

export interface CryptoReportCurrentPageRepository {
  /**
   * CreateOrUpdate crypto report current page.
   *
   * @param cryptoReportCurrentPage New CryptoReportCurrentPage.
   * @returns Created or Updated CryptoReportCurrentPage.
   */
  createOrUpdate: (
    cryptoReportCurrentPage: CryptoReportCurrentPage,
  ) => Promise<void>;

  /**
   * Get current page.
   * @param date
   * @returns CryptoReportCurrentPage found or null otherwise.
   */
  getCurrentPage: () => Promise<CryptoReportCurrentPage>;
}
