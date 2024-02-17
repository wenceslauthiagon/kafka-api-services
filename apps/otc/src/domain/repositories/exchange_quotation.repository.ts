import { Pagination, TPaginationResponse } from '@zro/common';
import { ExchangeQuotation, ExchangeQuotationState } from '@zro/otc/domain';

export type GetExchangeQuotationFilter = {
  quotation?: number;
  state?: ExchangeQuotationState;
  gatewayName?: string;
  solicitationPspId?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
};

export interface ExchangeQuotationRepository {
  /**
   * Insert a ExchangeQuotation.
   * @param exchangeQuotation ExchangeQuotation to save.
   * @returns Created exchangeQuotation.
   */
  create: (exchangeQuotation: ExchangeQuotation) => Promise<ExchangeQuotation>;

  /**
   * Update a ExchangeQuotation.
   * @param exchangeQuotation ExchangeQuotation to update.
   * @returns Updated ExchangeQuotation.
   */
  update: (exchangeQuotation: ExchangeQuotation) => Promise<ExchangeQuotation>;

  /**
   * Search by ExchangeQuotation ID.
   * @param id ExchangeQuotation ID.
   * @return ExchangeQuotation found.
   */
  getById: (id: string) => Promise<ExchangeQuotation>;

  /**
   * Search by ExchangeQuotation solicitationId.
   * @param solicitationId ExchangeQuotation solicitationId.
   * @return ExchangeQuotation found.
   */
  getBySolicitationId: (
    solicitationPspId: string,
  ) => Promise<ExchangeQuotation>;

  /**
   * Search by ExchangeQuotation state.
   * @param state ExchangeQuotation state.
   * @return ExchangeQuotation found.
   */
  getAllByStateIn: (
    state: ExchangeQuotationState[],
  ) => Promise<ExchangeQuotation[]>;

  /**
   * List all Exchange Quotation.
   * @param pagination pagination.
   * @return Exchange Quotations found.
   */
  getAll: (
    pagination: Pagination,
    filter?: GetExchangeQuotationFilter,
  ) => Promise<TPaginationResponse<ExchangeQuotation>>;
}
