import { GetStreamQuotationGateway } from '@zro/quotations/application';

/**
 * GetStreamQuotationService interface models a infrastructure level stream
 * quotation service required methods.
 */
export interface GetStreamQuotationService {
  /**
   * Get associated gateway.
   * @returns Stream quotation associated gateway.
   */
  getGateway(): GetStreamQuotationGateway;
}
