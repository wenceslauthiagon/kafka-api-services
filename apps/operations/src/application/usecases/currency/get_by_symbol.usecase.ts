import { Logger } from 'winston';

import { MissingDataException } from '@zro/common';
import { Currency, CurrencyRepository } from '@zro/operations/domain';
import { CurrencyNotFoundException } from '../../exceptions/currency_not_found.exception';

export class GetCurrencyBySymbolUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private logger: Logger,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: GetCurrencyBySymbolUseCase.name });
  }

  /**
   * Get the Currency by symbol.
   *
   * @param symbol Currency symbol.
   * @returns Currency found.
   */
  async execute(symbol: string): Promise<Currency> {
    // Data input check
    if (!symbol) {
      throw new MissingDataException(['Symbol']);
    }

    // Search currency
    const result = await this.currencyRepository.getBySymbol(symbol);

    this.logger.debug('Found currency.', { result });

    if (!result) {
      throw new CurrencyNotFoundException({ symbol });
    }

    return result;
  }
}
