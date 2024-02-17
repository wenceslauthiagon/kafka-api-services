import { Currency } from '@zro/operations/domain';
import { OperationStreamQuotation } from '@zro/operations/domain';

export interface OperationStreamQuotationRepository {
  createOrUpdate: (
    operationStreamQuotations: OperationStreamQuotation[],
  ) => Promise<void>;
  getByBaseCurrencyAndQuoteCurrency: (
    baseCurrency: Currency,
    quoteCurrency: Currency,
  ) => Promise<OperationStreamQuotation[]>;
}
