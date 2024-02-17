import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  ExchangeQuotation,
  ExchangeQuotationRepository,
  GetExchangeQuotationFilter,
} from '@zro/otc/domain';

export class GetAllExchangeQuotationUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param exchangeQuotationRepository Exchange Quotation repository.
   */
  constructor(
    private logger: Logger,
    private readonly exchangeQuotationRepository: ExchangeQuotationRepository,
  ) {
    this.logger = logger.child({
      context: GetAllExchangeQuotationUseCase.name,
    });
  }

  async execute(
    pagination: Pagination,
    filter?: GetExchangeQuotationFilter,
  ): Promise<TPaginationResponse<ExchangeQuotation>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search exchange quotation
    const exchangeQuotations = await this.exchangeQuotationRepository.getAll(
      pagination,
      filter,
    );

    this.logger.debug('Found exchange quotations.', {
      exchangeQuotation: exchangeQuotations,
    });

    return exchangeQuotations;
  }
}
