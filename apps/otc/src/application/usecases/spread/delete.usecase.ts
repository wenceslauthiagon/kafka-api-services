import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { SpreadEntity, SpreadRepository } from '@zro/otc/domain';
import { SpreadEventEmitter, OperationService } from '@zro/otc/application';

export class DeleteSpreadUseCase {
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
    this.logger = logger.child({
      context: DeleteSpreadUseCase.name,
    });
  }

  /**
   * Delete new spreads.
   *
   * @param {Currency} currency Spread's source.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(currency: Currency): Promise<void> {
    // Data input check
    if (!currency) {
      throw new MissingDataException(['Base']);
    }

    // Get Spread's currency
    const currencyFound = await this.operationService.getCurrencyBySymbol(
      currency.symbol,
    );

    this.logger.debug('Found currency.', { currency: currencyFound });

    if (!currencyFound) {
      this.logger.info('Nothing to delete. Base currency not found.');
      return;
    }

    // delete all existing spreads
    const deletedSpreads =
      await this.spreadRepository.deleteByCurrency(currencyFound);

    this.logger.info('Deleted spreads.', { spread: deletedSpreads });

    const spread = new SpreadEntity({ currency });

    // Fire DeletedSpreadEvent
    this.eventEmitter.deletedSpread(spread);
  }
}
