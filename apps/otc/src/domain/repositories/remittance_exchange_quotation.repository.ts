import {
  ExchangeQuotation,
  Remittance,
  RemittanceExchangeQuotation,
} from '@zro/otc/domain';

export interface RemittanceExchangeQuotationRepository {
  /**
   * Insert a RemittanceExchangeQuotation.
   * @param remittanceExchangeQuotation RemittanceExchangeQuotation to save.
   * @returns Created RemittanceExchangeQuotation.
   */
  create: (
    remittanceExchangeQuotation: RemittanceExchangeQuotation,
  ) => Promise<RemittanceExchangeQuotation>;

  /**
   * Update a RemittanceExchangeQuotation.
   * @param exchangeQuotation RemittanceExchangeQuotation to update.
   * @returns Updated RemittanceExchangeQuotation.
   */
  update: (
    remittanceExchangeQuotation: RemittanceExchangeQuotation,
  ) => Promise<RemittanceExchangeQuotation>;

  /**
   * Search by Remittance ID.
   * @param remittance Remittance ID..
   * @return RemittanceExchangeQuotation found.
   */
  getAllByRemittance: (
    remittance: Remittance,
  ) => Promise<RemittanceExchangeQuotation[]>;

  /**
   * Search by ExchangeQuotation ID.
   * @param exchangeQuotation ExchangeQuotation ID..
   * @return RemittanceExchangeQuotation found.
   */
  getAllByExchangeQuotation: (
    exchangeQuotation: ExchangeQuotation,
  ) => Promise<RemittanceExchangeQuotation[]>;
}
