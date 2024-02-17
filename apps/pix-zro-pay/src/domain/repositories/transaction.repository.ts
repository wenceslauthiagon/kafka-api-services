import { Transaction } from '@zro/pix-zro-pay/domain';

export interface TransactionRepository {
  /**
   * Insert a Transaction.
   * @param transaction Transaction to save.
   * @returns Created Transaction.
   */
  create(transaction: Transaction): Promise<Transaction>;

  /**
   * Update a Transaction.
   * @param transaction Transaction to update.
   * @returns Updated transaction.
   */
  update(transaction: Transaction): Promise<Transaction>;

  /**
   * get a Transaction by id.
   * @param id Transaction id to get.
   * @returns get Transaction.
   */
  getById(id: number): Promise<Transaction>;

  /**
   * get a Transaction by uuid.
   * @param uuid Transaction id to get.
   * @returns get Transaction.
   */
  getByUuid(uuid: string): Promise<Transaction>;
}
