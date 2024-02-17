import { Logger } from 'winston';
import { isNumber } from 'class-validator';
import { formatValueFromFloatToInt, MissingDataException } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { OrderSide } from '@zro/otc/domain';
import {
  QuotationTrendRepository,
  QuotationTrendResolution,
  QuotationTrendWindow,
  quotationTrendWindowMinResolution,
  StreamPairRepository,
} from '@zro/quotations/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  OperationService,
  QuotationTrendResolutionUnderMinResolutionException,
} from '@zro/quotations/application';

type GetTrendPricesItem = {
  price: number;
  [OrderSide.BUY]: number;
  [OrderSide.SELL]: number;
};
type PairCurrency = string;
type Timestamp = string;
type GetTrendPrices = Record<
  PairCurrency,
  Record<Timestamp, GetTrendPricesItem>
>;

type GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrencyPoint = {
  timestamp: string;
  price: number;
  buy: number;
  sell: number;
};

type GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrency = {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  points: GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrencyPoint[];
};

export class GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrenciesUseCase {
  private readonly AMOUNT = 1; // Unity value

  constructor(
    private logger: Logger,
    private readonly quotationTrendRepository: QuotationTrendRepository,
    private readonly streamPairRepository: StreamPairRepository,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context:
        GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrenciesUseCase.name,
    });
  }

  /**
   * Get trends by base currency.
   * @returns The trends.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {QuotationTrendResolutionUnderMinResolutionException} Thrown when a resolution is not valid.
   */
  async execute(
    window: QuotationTrendWindow,
    resolution: QuotationTrendResolution,
    baseCurrencies: Currency[],
    quoteCurrency: Currency,
  ): Promise<GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrency[]> {
    // Sanity check
    if (
      !window ||
      !resolution ||
      !baseCurrencies?.length ||
      !quoteCurrency?.symbol
    ) {
      throw new MissingDataException([
        ...(!window ? ['Window'] : []),
        ...(!resolution ? ['Resolution'] : []),
        ...(!baseCurrencies?.length ? ['Base Currency'] : []),
        ...(!quoteCurrency?.symbol ? ['Quote Currency'] : []),
      ]);
    }

    // Get resolution index in enum
    const minResolutionAllowed = Object.keys(
      quotationTrendWindowMinResolution,
    ).indexOf(window);
    const checkResolution = Object.values(QuotationTrendResolution).indexOf(
      resolution,
    );
    // Check resolution index
    if (checkResolution < minResolutionAllowed) {
      throw new QuotationTrendResolutionUnderMinResolutionException(resolution);
    }

    baseCurrencies = await Promise.all(
      baseCurrencies.map((item) =>
        this.operationService.getCurrencyBySymbol(item.symbol),
      ),
    );
    // Remove inactive currencies
    baseCurrencies = baseCurrencies.filter((item) => item.isActive());

    if (!baseCurrencies?.length) return [];

    this.logger.debug('BaseCurrencies found.', { baseCurrencies });

    quoteCurrency = await this.operationService.getCurrencyBySymbol(
      quoteCurrency.symbol,
    );
    if (!quoteCurrency?.isActive()) {
      throw new CurrencyNotFoundException(quoteCurrency);
    }

    this.logger.debug('QuoteCurrency found.', { quoteCurrency });

    // Get streamPair datas
    const streamPairsFound = (
      await Promise.all(
        baseCurrencies.map(async (item) => {
          const results =
            await this.streamPairRepository.getAllByBaseAndQuoteCurrencyAndActiveIsTrue(
              item,
              quoteCurrency,
            );

          // TODO: Is this return right?
          if (!results.length) return null;

          // Sort streamPairs by priority and get the first one
          const [pair] = results.sort((a, b) => a.priority - b.priority);
          pair.baseCurrency = item;
          pair.quoteCurrency = quoteCurrency;
          return pair;
        }),
      )
    ).filter((i) => i);
    if (!streamPairsFound.length) return [];

    this.logger.debug('StreamPairs found.', { streamPairsFound });

    baseCurrencies = streamPairsFound.map((item) => item.baseCurrency);

    // Get trend datas
    const trendsFound =
      await this.quotationTrendRepository.getAvgByWindowAndResolutionAndAmountAndBaseAndQuoteCurrency(
        window,
        resolution,
        this.AMOUNT,
        baseCurrencies,
        quoteCurrency,
      );
    if (!trendsFound.length) return [];

    // Get valid gateways by stremPair
    const streamPairGateways = streamPairsFound.reduce(
      (acc, item) => ({
        ...acc,
        [`${item.baseCurrency.symbol}/${item.quoteCurrency.symbol}`]:
          item.gatewayName,
      }),
      {},
    );

    // Remove trends with invalid gateway
    const activeTrends = trendsFound.filter(
      ({ gatewayName, baseCurrency, quoteCurrency }) =>
        gatewayName ===
        streamPairGateways[`${baseCurrency.symbol}/${quoteCurrency.symbol}`],
    );
    if (!activeTrends.length) return [];

    this.logger.debug('Active trends found.', { activeTrends });

    // Get trend prices
    const resultPrice: GetTrendPrices = streamPairsFound.reduce(
      (acc, item) => ({
        ...acc,
        [`${item.baseCurrency.symbol}/${item.quoteCurrency.symbol}`]: null,
      }),
      {},
    );

    for (let index = 0; index < activeTrends.length; index++) {
      const trend = activeTrends[index];
      const timestamp = trend.timestamp.toISOString();
      const pair = `${trend.baseCurrency.symbol}/${quoteCurrency.symbol}`;

      if (!resultPrice[pair]?.[timestamp]) {
        resultPrice[pair] = {
          ...resultPrice[pair],
          [timestamp]: {
            price: null,
            [OrderSide.BUY]: null,
            [OrderSide.SELL]: null,
          },
        };
      }

      resultPrice[pair][timestamp][trend.side] = trend.price;

      const resultBuy = resultPrice[pair][timestamp][OrderSide.BUY];
      const resultSell = resultPrice[pair][timestamp][OrderSide.SELL];
      if (isNumber(resultBuy) && isNumber(resultSell)) {
        resultPrice[pair][timestamp].price = (resultBuy + resultSell) / 2;
      }
    }

    this.logger.debug('ResultPrice created.', { resultPrice });

    // Format result
    const result = Object.entries(
      resultPrice,
    ).map<GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrency>(
      ([pair, trends]) => {
        const baseCurrency = baseCurrencies.find((i) =>
          pair.startsWith(i.symbol),
        );
        return {
          baseCurrency,
          quoteCurrency,
          points: Object.entries(trends).map(([timestamp, value]) => ({
            timestamp,
            buy:
              value.buy &&
              formatValueFromFloatToInt(value.buy, quoteCurrency.decimal),
            sell:
              value.sell &&
              formatValueFromFloatToInt(value.sell, quoteCurrency.decimal),
            price:
              value.price &&
              formatValueFromFloatToInt(value.price, quoteCurrency.decimal),
          })),
        };
      },
    );

    this.logger.debug('Trend results found.', { result });

    return result;
  }
}
