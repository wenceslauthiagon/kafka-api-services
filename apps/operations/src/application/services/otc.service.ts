import { Currency, Operation, Receipt } from '@zro/operations/domain';
import { Conversion } from '@zro/otc/domain';
import { User } from '@zro/users/domain';

export interface OtcService {
  /**
   * Get receipt of otc by user and operation.
   * @param user The user.
   * @param operation The operation.
   * @param currency The currency.
   * @returns Receipt of otc.
   */
  getOtcReceipt(
    user: User,
    operation: Operation,
    currency: Currency,
  ): Promise<Receipt>;

  /**
   * Get conversion by operation.
   * @param operation The operation.
   * @returns Conversion.
   */
  getConversionByOperation(operation: Operation): Promise<Conversion>;

  /**
   * Get crypto price by currency and date.
   * @param currency The currency.
   * @param createdAt The date.
   * @returns Crypto price.
   */
  getCryptoPriceByCurrencyAndDate(
    currency: Currency,
    createdAt: Date,
  ): Promise<number>;
}
