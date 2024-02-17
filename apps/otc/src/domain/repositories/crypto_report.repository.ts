import { User } from '@zro/users/domain';
import { CryptoReport } from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';
import { Pagination, TPaginationResponse } from '@zro/common';

export enum CryptoReportRequestSort {
  CREATED_AT = 'created_at',
}

export interface CryptoReportRepository {
  /**
   * Insert a CryptoReport.
   * @param cryptoReport CryptoReport to save.
   * @returns Created CryptoReport.
   */
  create(cryptoReport: CryptoReport): Promise<CryptoReport>;

  /**
   * Update a CryptoReport.
   * @param cryptoReport CryptoReport to save.
   * @returns Created CryptoReport.
   */
  update(cryptoReport: CryptoReport): Promise<CryptoReport>;

  /**
   * Search by CryptoReport ID.
   * @param id CryptoReport ID.
   * @return CryptoReport found.
   */
  getById(id: string): Promise<CryptoReport>;

  /**
   * Search last CryptoReport before date by user and currency.
   * @param user User.
   * @param currency Currency.
   * @param createdAt Date.
   * @return CryptoReport found.
   */
  getLastBeforeDateByUserAndCurrency(
    user: User,
    crypto: Currency,
    createdAt: Date,
  ): Promise<CryptoReport>;

  /**
   * Search all by user and currency.
   * @param user CryptoReport owner.
   * @param crypto CryptoReport currency ID.
   * @param createdAtStart Created at start date.
   * @param createdAtEnd Created at end date.
   * @return CryptoReports found.
   */
  getAllByUserAndCurrency(
    user: User,
    crypto: Currency,
    createdAtStart?: Date,
    createdAtEnd?: Date,
  ): Promise<CryptoReport[]>;

  /**
   * Search all from date.
   * @param createdAtStart Date.
   * @param pagination Pagination.
   * @return CryptoReports found.
   */
  getAllFromDate(
    createdAtStart: Date,
    pagination: Pagination,
  ): Promise<TPaginationResponse<CryptoReport>>;
}
