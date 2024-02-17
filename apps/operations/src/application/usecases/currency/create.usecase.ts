import { Logger } from 'winston';

import { MissingDataException } from '@zro/common';
import {
  Currency,
  CurrencyEntity,
  CurrencyRepository,
  CurrencyState,
  CurrencySymbolAlign,
  CurrencyType,
} from '@zro/operations/domain';

export class CreateCurrencyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private logger: Logger,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: CreateCurrencyUseCase.name });
  }

  /**
   * Create the Currency.
   *
   * @param title Currency title.
   * @param symbol Currency symbol.
   * @param tag Currency tag.
   * @param decimal Currency decimal.
   * @param type Currency type.
   * @param [symbolAlign] Currency symbolAlign.
   * @param [state] Currency state.
   * @returns Currency created.
   */
  async execute(
    title: string,
    symbol: string,
    tag: string,
    decimal: number,
    type: CurrencyType,
    symbolAlign?: CurrencySymbolAlign,
    state?: CurrencyState,
  ): Promise<Currency> {
    // Data input check
    if (!title || !symbol || !tag || !type) {
      throw new MissingDataException([
        ...(!title ? ['Title'] : []),
        ...(!symbol ? ['Symbol'] : []),
        ...(!tag ? ['Tag'] : []),
        ...(!type ? ['Type'] : []),
      ]);
    }

    // Check if currency's symbol is available
    const checkCurrencySymbol =
      await this.currencyRepository.getBySymbol(symbol);

    this.logger.debug('Check if currency symbol exists.', {
      currency: checkCurrencySymbol,
    });

    if (checkCurrencySymbol) {
      return checkCurrencySymbol;
    }

    const currency = new CurrencyEntity({
      title,
      symbol,
      tag,
      decimal,
      symbolAlign,
      type,
      state,
    });

    // Create currency
    const result = await this.currencyRepository.create(currency);

    this.logger.debug('Added currency.', { result });

    return result;
  }
}
