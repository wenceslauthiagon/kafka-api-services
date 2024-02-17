import { Logger } from 'winston';

import { MissingDataException } from '@zro/common';
import { Currency, CurrencyRepository } from '@zro/operations/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';

export class GetCurrencyByTagUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private logger: Logger,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: GetCurrencyByTagUseCase.name });
  }

  /**
   * Get the Currency by tag.
   *
   * @param tag Currency tag.
   * @returns Currency found.
   */
  async execute(tag: string): Promise<Currency> {
    // Data input check
    if (!tag) {
      throw new MissingDataException(['Tag']);
    }

    // Search currency
    const result = await this.currencyRepository.getByTag(tag);

    this.logger.debug('Found currency.', { result });

    if (!result) {
      throw new CurrencyNotFoundException({ tag });
    }

    return result;
  }
}
