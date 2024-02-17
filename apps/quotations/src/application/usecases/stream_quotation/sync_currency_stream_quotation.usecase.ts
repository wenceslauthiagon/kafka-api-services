import { Logger } from 'winston';
import { OrderSide } from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';
import {
  StreamQuotationRepository,
  StreamQuotation,
  QuotationTrendRepository,
  QuotationTrend,
  QuotationTrendEntity,
} from '@zro/quotations/domain';
import { OperationService } from '@zro/quotations/application';

export class SyncCurrencyStreamQuotationUseCase {
  constructor(
    private logger: Logger,
    private readonly streamQuotationRepository: StreamQuotationRepository,
    private readonly quotationTrendRepository: QuotationTrendRepository,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: SyncCurrencyStreamQuotationUseCase.name,
    });
  }

  /**
   * Sync stream quotations by currency.
   * @returns The StreamQuotations with the higher priority.
   */
  async execute(quoteCurrency: Currency): Promise<StreamQuotation[]> {
    this.logger.debug('Syncing currency stream quotations.');

    // Get all active currencies
    const activeCurrencies =
      await this.operationService.getAllActiveCurrencies();
    if (!activeCurrencies.length) return [];

    const streamQuotations = (
      await Promise.all(
        activeCurrencies.map(async (baseCurrency) => {
          const streamQuotationsFound =
            await this.streamQuotationRepository.getByBaseCurrencyAndQuoteCurrency(
              baseCurrency,
              quoteCurrency,
            );

          if (!streamQuotationsFound?.length) return null;

          // Sort stream quotations by priority
          return streamQuotationsFound
            .sort((a, b) => a.streamPair.priority - b.streamPair.priority)
            .shift();
        }),
      )
    ).filter((i) => i);

    if (!streamQuotations.length) return [];

    // Create quotation trends
    const quotationTrends = streamQuotations.reduce<QuotationTrend[]>(
      (acc, quotation) => [
        ...acc,
        new QuotationTrendEntity({
          baseCurrency: quotation.baseCurrency,
          quoteCurrency: quotation.quoteCurrency,
          gatewayName: quotation.gatewayName,
          amount: quotation.amount,
          price: quotation.buy,
          side: OrderSide.BUY,
        }),
        new QuotationTrendEntity({
          baseCurrency: quotation.baseCurrency,
          quoteCurrency: quotation.quoteCurrency,
          gatewayName: quotation.gatewayName,
          amount: quotation.amount,
          price: quotation.sell,
          side: OrderSide.SELL,
        }),
      ],
      [],
    );

    // Store all collected quotation trends
    await this.quotationTrendRepository.createOrUpdate(quotationTrends);

    return streamQuotations;
  }
}
