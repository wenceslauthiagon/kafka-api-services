import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Currency, CurrencyRepository } from '@zro/operations/domain';

export class GetCurrencyByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private logger: Logger,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: GetCurrencyByIdUseCase.name });
  }

  /**
   * Get the Currency by id.
   *
   * @param {number} id Currency id.
   * @returns {Currency} Currency found or null if not found.
   */
  async execute(id: number): Promise<Currency> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search currency
    const result = await this.currencyRepository.getById(id);

    this.logger.debug('Found currency.', { result });

    return result;
  }
}
