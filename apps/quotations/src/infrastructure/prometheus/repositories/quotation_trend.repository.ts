import { isNumber } from 'class-validator';
import {
  PrometheusGetResponse,
  PrometheusService,
  PrometheusSet,
} from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { OrderSide } from '@zro/otc/domain';
import {
  QuotationTrend,
  QuotationTrendEntity,
  QuotationTrendRepository,
  QuotationTrendResolution,
  QuotationTrendWindow,
} from '@zro/quotations/domain';

const PREFIX = 'quotation_trend';

export class QuotationTrendPrometheusRepository
  implements QuotationTrendRepository
{
  constructor(private readonly prometheusService: PrometheusService) {}

  static toDomain(data: PrometheusGetResponse) {
    const info = data.metric.labels;
    const result = [];
    // To keep data order
    for (let index = 0; index < data.values.length; index++) {
      result.push(
        new QuotationTrendEntity({
          baseCurrency: new CurrencyEntity({ symbol: info.baseCurrency }),
          quoteCurrency: new CurrencyEntity({ symbol: info.quoteCurrency }),
          gatewayName: info.gateway,
          amount: info.tier,
          side: info.side,
          price: isNumber(data.values[index].value)
            ? data.values[index].value
            : null,
          timestamp: data.values[index].time,
        }),
      );
    }
    return result;
  }

  async createOrUpdate(trends: QuotationTrend[]): Promise<void> {
    const data = trends.map<PrometheusSet>((item) => ({
      name: PREFIX,
      help: 'description',
      value: item.price,
      labels: {
        gateway: item.gatewayName,
        baseCurrency: item.baseCurrency.symbol,
        quoteCurrency: item.quoteCurrency.symbol,
        side: item.side,
        tier: item.amount,
      },
    }));

    await this.prometheusService.set(data);
  }

  async getAvgByWindowAndResolutionAndAmountAndBaseAndQuoteCurrency(
    window: QuotationTrendWindow,
    resolution: QuotationTrendResolution,
    amount: number,
    baseCurrencies: Currency[],
    quoteCurrency: Currency,
  ): Promise<QuotationTrend[]> {
    const baseCurrencySymbols = baseCurrencies
      .map(({ symbol }) => symbol)
      .join('|');
    const query = `avg_over_time(${PREFIX}{tier="${amount}",baseCurrency=~"${baseCurrencySymbols}",quoteCurrency="${quoteCurrency.symbol}",side=~"${OrderSide.BUY}|${OrderSide.SELL}"}[${window}])[${window}:${resolution}]`;

    const data = await this.prometheusService.get(query);

    return data?.flatMap(QuotationTrendPrometheusRepository.toDomain) ?? [];
  }
}
