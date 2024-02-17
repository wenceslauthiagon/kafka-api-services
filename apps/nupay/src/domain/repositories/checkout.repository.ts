import { Checkout } from '@zro/nupay/domain';

export interface CheckoutRepository {
  create(checkoutData: Partial<Checkout>): Promise<Checkout>;
  getById(id: string): Promise<Checkout | null>;
  getAll(): Promise<Checkout[] | null>;
  getByReferenceId(id: string): Promise<Checkout | null>;
  findPending(): Promise<Checkout[] | null>;
  update(checkout: Partial<Checkout>): Promise<Checkout>;
}
