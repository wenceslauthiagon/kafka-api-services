import { TransactionCurrentPage } from '@zro/payments-gateway/domain';

export interface TransactionCurrentPageRepository {
  /**
   * CreateOrUpdate pix statement current page.
   *
   * @param transactionCurrentPage New transactionCurrentPage.
   * @returns Created or Updated transactionCurrentPage.
   */
  createOrUpdate: (
    transactionCurrentPage: TransactionCurrentPage,
  ) => Promise<void>;

  /**
   * Get current page.
   * @param date
   * @returns TransactionCurrentPage found or null otherwise.
   */
  getCurrentPage: () => Promise<TransactionCurrentPage>;
}
