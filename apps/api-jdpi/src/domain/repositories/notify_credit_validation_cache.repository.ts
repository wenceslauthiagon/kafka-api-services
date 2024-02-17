import { NotifyCreditValidation } from '@zro/api-jdpi/domain';

export interface NotifyCreditValidationCacheRepository {
  /**
   * get a NotifyCreditValidation by hash.
   * @param hash Deposit hash.
   * @returns Found validation.
   */
  getByHash(hash: string): Promise<NotifyCreditValidation>;

  /**
   * Create a NotifyCreditValidation hash.
   * @param hash Deposit hash.
   * @param validation Deposit to save.
   * @returns Created Deposit.
   */
  createHash(
    hash: string,
    validation: NotifyCreditValidation,
  ): Promise<NotifyCreditValidation>;
}
