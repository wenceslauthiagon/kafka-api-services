import {
  PrometheusService,
  PrometheusSet,
  formatValueFromIntToFloat,
} from '@zro/common';
import {
  ExchangeQuotationServerRepository,
  ExchangeQuotation,
} from '@zro/otc/domain';

const PREFIX = 'exchange_quotation';

export class ExchangeQuotationPrometheusRepository
  implements ExchangeQuotationServerRepository
{
  constructor(private readonly prometheusService: PrometheusService) {}

  async createOrUpdate(exchanges: ExchangeQuotation[]): Promise<void> {
    const data = exchanges.map<PrometheusSet>((item) => ({
      name: PREFIX,
      help: 'description',
      value: formatValueFromIntToFloat(item.quotation),
      labels: {
        provider: item.gatewayName,
      },
    }));

    await this.prometheusService.set(data);
  }
}
