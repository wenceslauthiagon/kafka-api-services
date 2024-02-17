import { Currency } from '@zro/operations/domain';
import { StreamQuotationGateway } from '@zro/quotations/domain';

export interface StreamQuotationGatewayRepository {
  createOrUpdate(quotations: StreamQuotationGateway[]): Promise<void>;
  getByBaseCurrencyAndQuoteCurrencyAndGatewayName(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    gatewayName: string,
  ): Promise<StreamQuotationGateway>;
}
