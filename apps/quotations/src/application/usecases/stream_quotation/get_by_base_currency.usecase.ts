import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  StreamQuotationRepository,
  StreamQuotation,
} from '@zro/quotations/domain';

export class GetStreamQuotationByBaseCurrencyUseCase {
  constructor(
    private logger: Logger,
    private readonly streamQuotationRepository: StreamQuotationRepository,
    private readonly operationCurrencySymbol: string,
  ) {
    this.logger = logger.child({
      context: GetStreamQuotationByBaseCurrencyUseCase.name,
    });
  }

  /**
   * Get stream quotation by base currency.
   * @returns The quotation with the higher priority.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(baseCurrency: Currency): Promise<StreamQuotation> {
    // Checking missing params
    if (!baseCurrency) {
      throw new MissingDataException(['Base currency']);
    }

    const quoteCurrency = new CurrencyEntity({
      symbol: this.operationCurrencySymbol,
    });

    const streamQuotationsFound =
      await this.streamQuotationRepository.getByBaseCurrencyAndQuoteCurrency(
        baseCurrency,
        quoteCurrency,
      );

    if (!streamQuotationsFound.length) {
      return null;
    }

    // Sort stream quotations by priority
    const [streamQuotation] = streamQuotationsFound.sort(
      (a, b) => a.streamPair.priority - b.streamPair.priority,
    );

    this.logger.debug('StreamQuotation found.', { streamQuotation });

    return streamQuotation;
  }
}
