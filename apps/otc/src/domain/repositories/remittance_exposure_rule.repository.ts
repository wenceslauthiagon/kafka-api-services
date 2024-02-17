import { Pagination, TPaginationResponse } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { RemittanceExposureRule } from '@zro/otc/domain';

export interface RemittanceExposureRuleRepository {
  /**
   * Insert a RemittanceExposureRule.
   * @param remittanceExposureRule RemittanceExposureRule to save.
   * @returns Created remittanceExposureRule.
   */
  create: (
    remittanceExposureRule: RemittanceExposureRule,
  ) => Promise<RemittanceExposureRule>;

  /**
   * Update a RemittanceExposureRule.
   * @param remittanceExposureRule RemittanceExposureRule to update.
   * @returns Updated RemittanceExposureRule.
   */
  update: (
    remittanceExposureRule: RemittanceExposureRule,
  ) => Promise<RemittanceExposureRule>;

  /**
   * Search by RemittanceExposureRule Currency.
   * @param currency currency.
   * @return RemittanceExposureRule found.
   */
  getByCurrency: (currency: Currency) => Promise<RemittanceExposureRule>;

  /**
   * Search by RemittanceExposureRule ID.
   * @param id ID.
   * @return RemittanceExposureRule found.
   */
  getById: (id: string) => Promise<RemittanceExposureRule>;

  /**
   * List all RemittanceExposureRule.
   * @param pagination pagination.
   * @param currency currency.
   * @return RemittanceExposureRules found.
   */
  getAll: (
    pagination: Pagination,
    currency?: Currency,
  ) => Promise<TPaginationResponse<RemittanceExposureRule>>;
}
