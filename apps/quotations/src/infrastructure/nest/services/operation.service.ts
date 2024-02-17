import { Logger } from 'winston';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { OperationService } from '@zro/quotations/application';
import { LoadActiveCurrenciesService } from '@zro/quotations/infrastructure';

export class OperationServiceKafka implements OperationService {
  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private logger: Logger,
    private loadGetAllCurrencyService: LoadActiveCurrenciesService,
  ) {
    this.logger = logger.child({ context: OperationServiceKafka.name });
  }

  async getAllActiveCurrencies(): Promise<Currency[]> {
    const currencies =
      await this.loadGetAllCurrencyService.getActiveCurrencies();

    this.logger.debug('Active currencies found.', {
      length: currencies.length,
    });

    return currencies;
  }

  async getCurrencyBySymbol(symbol: string): Promise<Currency> {
    this.logger.debug('Get by Currency symbol request.', { symbol });

    const currencies =
      await this.loadGetAllCurrencyService.getActiveCurrencies();

    const response = currencies.find((item) => item.symbol === symbol);

    this.logger.debug('Get by Currency symbol response.', { response });

    if (!response) return null;

    return new CurrencyEntity({
      id: response.id,
      title: response.title,
      symbol: response.symbol,
      symbolAlign: response.symbolAlign,
      tag: response.tag,
      type: response.type,
      decimal: response.decimal,
      state: response.state,
    });
  }
}
