import { CheckoutHistoric } from '@zro/picpay/domain';

export interface CheckoutHistoricRepository {
  create(historicData: Partial<CheckoutHistoric>): Promise<CheckoutHistoric>;
  findByCheckoutId(checkoutId: string): Promise<CheckoutHistoric[]>;
}
