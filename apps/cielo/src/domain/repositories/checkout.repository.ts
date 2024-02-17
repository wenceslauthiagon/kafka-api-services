import { Checkout } from '@zro/cielo/domain';

export interface CheckoutRepository {
  create(checkoutData: Partial<Checkout>): Promise<Checkout>;
  getById(id: string): Promise<Checkout | null>;
  getByReferenceId(id: string): Promise<Checkout | null>;
  findCheckoutPending(): Promise<Checkout[] | null>;
  update(checkout: Partial<Checkout>): Promise<Checkout>;
}
