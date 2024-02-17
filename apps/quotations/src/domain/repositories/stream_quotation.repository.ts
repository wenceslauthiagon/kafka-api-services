import { Currency } from '@zro/operations/domain';
import { StreamQuotation } from '@zro/quotations/domain';

export interface StreamQuotationRepository {
  createOrUpdate(quotations: StreamQuotation[]): Promise<void>;
  getByBaseCurrencyAndQuoteCurrencyAndName(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    gatewayName: string,
  ): Promise<StreamQuotation>;
  getByBaseCurrencyAndQuoteCurrency(
    baseCurrency: Currency,
    quoteCurrency: Currency,
  ): Promise<StreamQuotation[]>;
}
