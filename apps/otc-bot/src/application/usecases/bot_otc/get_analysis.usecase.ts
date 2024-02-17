import { Logger } from 'winston';
import {
  formatValueFromFloatToInt,
  formatValueFromIntBpsToFloat,
  formatValueFromFloatToIntBps,
  formatValueFromIntToFloat,
  MissingDataException,
  PaginationEntity,
  PaginationOrder,
} from '@zro/common';
import {
  BotOtc,
  BotOtcAnalysis,
  BotOtcOrderRepository,
  BotOtcOrderRequestSort,
  BotOtcOrderState,
  BotOtcRepository,
  TGetBotOtcOrderFilter,
} from '@zro/otc-bot/domain';
import {
  BotOtcNotFoundException,
  OperationService,
  QuotationService,
} from '@zro/otc-bot/application';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { TaxNotFoundException } from '@zro/quotations/application';

export class GetBotOtcAnalysisUseCase {
  private readonly FIRST_PAGE = 1;
  private readonly PAGE_SIZE = 100;
  private baseCurrencyDecimal: number = null;
  private profit = 0;
  private volume = 0;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param botOtcRepository Bot Otc repository.
   * @param botOtcOrderRepository Bot Otc Order repository.
   * @param operationService Operation service.
   * @param otcService Otc service.
   * @param remittanceCurrencyTag Currency tag traded by forex.
   * @param remittanceCurrencyDecimals Currency decimals traded by forex.
   * @param iofName IOF name.
   *
   */
  constructor(
    private logger: Logger,
    private readonly botOtcRepository: BotOtcRepository,
    private readonly botOtcOrderRepository: BotOtcOrderRepository,
    private readonly operationService: OperationService,
    private readonly quotationService: QuotationService,
    private readonly remittanceCurrencyTag: string,
    private readonly remittanceCurrencyDecimals: number,
    private readonly iofName: string,
  ) {
    this.logger = logger.child({
      context: GetBotOtcAnalysisUseCase.name,
    });
  }

  async execute(
    id: BotOtc['id'],
    createdAtStart: Date,
    createdAtEnd: Date,
  ): Promise<BotOtcAnalysis> {
    // Data input check
    if (!id || !createdAtStart || !createdAtEnd) {
      throw new MissingDataException([
        ...(!id ? ['Bot Otc ID'] : []),
        ...(!createdAtStart ? ['Created At Start'] : []),
        ...(!createdAtEnd ? ['Created At End'] : []),
      ]);
    }

    const botOtc = await this.botOtcRepository.getById(id);

    this.logger.debug('Found bot otc.', {
      botOtc,
    });

    if (!botOtc) {
      throw new BotOtcNotFoundException({ id });
    }

    // Get IOF tax.
    const iof = await this.quotationService.getTaxByName(this.iofName);

    if (!iof) {
      throw new TaxNotFoundException({ name: this.iofName });
    }

    // Initial pagination.
    const pagination = new PaginationEntity({
      page: this.FIRST_PAGE,
      pageSize: this.PAGE_SIZE,
      sort: BotOtcOrderRequestSort.CREATED_AT,
      order: PaginationOrder.ASC,
    });

    // Search filter.
    const filter: TGetBotOtcOrderFilter = {
      botOtcId: id,
      createdAtStart,
      createdAtEnd,
      state: BotOtcOrderState.COMPLETED,
    };

    // While there are more pages to analyze the data, go on.
    let goOn = true;

    while (goOn) {
      // Get all completed bot otc orders.
      const botOtcOrders =
        await this.botOtcOrderRepository.getAllByFilterAndPagination(
          pagination,
          filter,
        );

      this.logger.debug('Completed bot otc orders found.', {
        botOtcOrders: botOtcOrders?.data,
      });

      // If no bot otc order is found, return.
      if (!botOtcOrders?.data?.length) return;

      for (const botOtcOrder of botOtcOrders.data) {
        // Should only calculate for orders with filled buy remittance's bank quote.
        if (!botOtcOrder.buyRemittance?.bankQuote) {
          continue;
        }

        // Search base currency decimal.
        if (!this.baseCurrencyDecimal) {
          const baseCurrency = await this.operationService.getCurrencyById({
            id: botOtcOrder.baseCurrency.id,
          });

          this.logger.debug('Found base currency.', {
            currency: baseCurrency,
          });

          if (!baseCurrency) {
            throw new CurrencyNotFoundException({
              id: botOtcOrder.baseCurrency.id,
            });
          }

          this.baseCurrencyDecimal = baseCurrency.decimal;
        }

        // Format values to match decimals with remittanceCurrencyDecimals.
        const buyExecutedAmountFormatted = formatValueFromIntToFloat(
          botOtcOrder.buyExecutedAmount,
          this.baseCurrencyDecimal,
        );
        const buyExecutedPriceFormatted = formatValueFromIntToFloat(
          botOtcOrder.buyExecutedPrice,
          botOtcOrder.buyPriceSignificantDigits,
        );
        const fxRate =
          botOtcOrder.buyRemittance.bankQuote *
          (1 + formatValueFromIntBpsToFloat(iof.value));
        const buyTotalInFiat = formatValueFromFloatToInt(
          buyExecutedAmountFormatted * buyExecutedPriceFormatted * fxRate,
          0,
        );

        const sellExecutedAmountFormatted = formatValueFromIntToFloat(
          botOtcOrder.sellExecutedAmount,
          this.baseCurrencyDecimal,
        );
        const sellExecutedPriceFormatted = formatValueFromIntToFloat(
          botOtcOrder.sellExecutedPrice,
          botOtcOrder.market.priceSignificantDigits,
        );
        const sellTotalInFiat = formatValueFromFloatToInt(
          sellExecutedAmountFormatted * sellExecutedPriceFormatted,
          this.remittanceCurrencyDecimals,
        );

        // Calculate profit and volume in remittance bank quote decimals.
        const currentProfit = sellTotalInFiat - buyTotalInFiat;
        this.profit += currentProfit;
        this.volume += sellTotalInFiat - currentProfit;
      }

      if (botOtcOrders.page >= botOtcOrders.pageTotal) {
        goOn = false;
      }

      pagination.page += 1;
    }

    // Calculate profit margin in bps.
    const profitMargin = formatValueFromFloatToIntBps(
      this.profit / this.volume,
    );

    return {
      botOtc,
      profit: this.profit,
      profitMargin,
      volume: this.volume,
      quoteCurrencyTag: this.remittanceCurrencyTag,
      quoteCurrencyDecimal: this.remittanceCurrencyDecimals,
    };
  }
}
