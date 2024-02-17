import { PixStatement } from '@zro/api-topazio/domain';

export interface PixStatementRepository {
  /**
   * Create pix statement.
   *
   * @param pixStatement New pixStatement.
   * @returns Created pixStatement.
   */
  create: (pixStatement: PixStatement) => Promise<PixStatement>;

  /**
   * Update pix statement.
   *
   * @param pixStatement New pixStatement.
   * @returns Created pixStatement.
   */
  update: (pixStatement: PixStatement) => Promise<PixStatement>;

  /**
   * Get by date formated YYYY-MM-DD.
   * @param date
   * @returns PixStatement found or null otherwise.
   */
  getAllByDate: (date: Date) => Promise<PixStatement[]>;

  /**
   * Get all.
   * @param page
   * @returns PixStatement found or null otherwise.
   */
  getAll: () => Promise<PixStatement[]>;
}
