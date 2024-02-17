import { CheckoutHistoric } from '@zro/cielo/domain';

export interface CheckoutHistoricRepository {
  create(historicData: Partial<CheckoutHistoric>): Promise<CheckoutHistoric>;
  findByCheckoutId(checkoutId: string): Promise<CheckoutHistoric[]>;
}
