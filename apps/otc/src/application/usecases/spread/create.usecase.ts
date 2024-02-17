import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import { Currency, CurrencyType } from '@zro/operations/domain';
import { Spread, SpreadEntity, SpreadRepository } from '@zro/otc/domain';
import { SpreadEventEmitter, OperationService } from '@zro/otc/application';

export class CreateSpreadUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param spreadRepository Spread repository.
   * @param operationService Operations service.
   * @param eventEmitter Spread event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly spreadRepository: SpreadRepository,
    private readonly operationService: OperationService,
    private readonly eventEmitter: SpreadEventEmitter,
  ) {
    this.logger = logger.child({ context: CreateSpreadUseCase.name });
  }

  /**
   * Create new spreads.
   *
   * @param {Currency} currency Spread's source.
   * @param {Spread[]} items Spread's values.
   * @returns {Spread[]} Spread created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    currency: Currency,
    items: Partial<Spread>[],
  ): Promise<Spread[]> {
    // Data input check
    if (!currency || !items) {
      throw new MissingDataException([
        ...(!currency ? ['Base'] : []),
        ...(!items ? ['Spreads'] : []),
      ]);
    }

    // Get Spread's currency
    let currencyFound = await this.operationService.getCurrencyBySymbol(
      currency.symbol,
    );

    this.logger.debug('Found currency.', { currencyFound });

    if (!currencyFound) {
      // Create currency
      currency.title = currency.symbol;
      currency.tag = currency.symbol;
      currency.decimal = 0;
      currency.type = CurrencyType.CRYPTO; // TODO: fix this value
      currencyFound = await this.operationService.createCurrency(currency);

      this.logger.warn('Created currency.', { currencyFound });
    }

    // Delete all existing spreads
    const deletedSpreads =
      await this.spreadRepository.deleteByCurrency(currencyFound);

    this.logger.debug('Spreads deleted.', { spread: deletedSpreads });

    const spreads = items.map<Spread>(
      ({ buy, amount, sell }) =>
        new SpreadEntity({ buy, sell, amount, currency: currencyFound }),
    );

    const addedSpreads = await Promise.all(
      spreads.map((item) =>
        this.spreadRepository.create({ ...item, id: uuidV4() }),
      ),
    );

    // Fire CreatedSpreadsEvent
    this.eventEmitter.createdSpreads(addedSpreads);

    this.logger.debug('Spreads added.', { spread: addedSpreads });

    return addedSpreads;
  }
}
