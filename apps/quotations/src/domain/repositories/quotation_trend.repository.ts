import { Currency } from '@zro/operations/domain';
import {
  QuotationTrend,
  QuotationTrendWindow,
  QuotationTrendResolution,
} from '@zro/quotations/domain';

export interface QuotationTrendRepository {
  createOrUpdate(trends: QuotationTrend[]): Promise<void>;
  getAvgByWindowAndResolutionAndAmountAndBaseAndQuoteCurrency(
    window: QuotationTrendWindow,
    resolution: QuotationTrendResolution,
    amount: number,
    baseCurrencies: Currency[],
    quoteCurrency: Currency,
  ): Promise<QuotationTrend[]>;
}
