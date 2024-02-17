import { ExchangeQuotation } from '@zro/otc/domain';

export interface ExchangeQuotationServerRepository {
  createOrUpdate: (exchanges: ExchangeQuotation[]) => Promise<void>;
}
