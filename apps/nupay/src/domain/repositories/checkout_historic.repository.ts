import { CheckoutHistoric } from '@zro/nupay/domain';

export interface CheckoutHistoricRepository {
  create(historicData: Partial<CheckoutHistoric>): Promise<CheckoutHistoric>;
  findByCheckoutId(checkoutId: string): Promise<CheckoutHistoric[]>;
}
