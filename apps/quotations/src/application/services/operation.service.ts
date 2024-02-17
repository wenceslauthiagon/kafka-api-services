import { Currency } from '@zro/operations/domain';

export interface OperationService {
  getAllActiveCurrencies: () => Promise<Currency[]>;
  getCurrencyBySymbol(symbol: string): Promise<Currency>;
}
