import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  PaginationResponse,
} from '@zro/common';
import { GetTaxFilter, Tax, TaxRepository } from '@zro/quotations/domain';

export class GetAllTaxUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param taxRepository Tax repository.
   */
  constructor(
    private logger: Logger,
    private readonly taxRepository: TaxRepository,
  ) {
    this.logger = logger.child({ context: GetAllTaxUseCase.name });
  }

  /**
   * List all Taxes.
   *
   * @returns Taxes found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    filter: GetTaxFilter,
  ): Promise<PaginationResponse<Tax>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }
    // Search Taxes
    const result = await this.taxRepository.getAllByFilterAndPagination(
      pagination,
      filter,
    );

    this.logger.debug('Found Taxes.', { result });

    return result;
  }
}
