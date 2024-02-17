import { GlobalLimit, LimitType } from '@zro/operations/domain';

export interface GlobalLimitRepository {
  /**
   * Get user limits by user and limit type.
   *
   * @param limitType Limit type.
   * @returns Global limit if found or null otherwise.
   */
  getByLimitType: (limitType: LimitType) => Promise<GlobalLimit>;
}
