import { Cashback } from '@zro/otc/domain';

export interface CashbackRepository {
  /**
   * Insert a Cashback.
   * @param cashback Cashback to save.
   * @returns Cashback entity.
   */
  create(cashback: Cashback): Promise<Cashback>;

  /**
   * Update a Cashback.
   * @param cashback Cashback to save.
   * @returns Cashback entity.
   */
  update(cashback: Cashback): Promise<Cashback>;

  /**
   * Search by Cashback ID.
   * @param id Cashback ID.
   * @returns Cashback entity.
   */
  getById(id: string): Promise<Cashback>;

  /**
   * Search by Cashback ID with Conversion.
   * @param id Cashback ID.
   * @returns Cashback entity.
   */
  getWithConversionById(id: string): Promise<Cashback>;
}
