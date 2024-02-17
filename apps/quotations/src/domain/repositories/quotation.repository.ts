import { Quotation } from '@zro/quotations/domain';

export interface QuotationRepository {
  /**
   * Insert a Quotation.
   * @param {Quotation} quotation Quotation to save.
   * @returns {Quotation} Created quotation.
   */
  create: (quotation: Quotation) => Promise<Quotation>;

  /**
   * Update a Quotation.
   * @param {Quotation} quotation Quotation to update.
   * @returns {Quotation} Updated Quotation.
   */
  update: (quotation: Quotation) => Promise<Quotation>;

  /**
   * Search by Quotation ID.
   * @param {UUID} id Quotation ID.
   * @return {Quotation} Quotation found.
   */
  getById: (id: string) => Promise<Quotation>;
}
