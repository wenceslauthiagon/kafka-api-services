import { Tax } from '@zro/quotations/domain';

export interface GetTaxByNameService {
  getTaxByName(name: string): Promise<Tax>;
}
