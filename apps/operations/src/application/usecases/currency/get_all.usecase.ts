import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import {
  Currency,
  CurrencyRepository,
  TGetCurrencyFilter,
} from '@zro/operations/domain';

export class GetAllCurrencyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private logger: Logger,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: GetAllCurrencyUseCase.name });
  }

  /**
   * List all Currencies by filter.
   * @param pagination pagination params.
   * @param filter filter params.
   * @returns Currencies found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    filter: TGetCurrencyFilter,
  ): Promise<TPaginationResponse<Currency>> {
    // Data input check
    if (!pagination || !filter) {
      throw new MissingDataException([
        ...(!pagination ? ['Pagination'] : []),
        ...(!filter ? ['Filter'] : []),
      ]);
    }

    // Search currencies
    const result = await this.currencyRepository.getByFilter(
      pagination,
      filter,
    );

    this.logger.debug('Found Currencies.', { result });

    return result;
  }
}
