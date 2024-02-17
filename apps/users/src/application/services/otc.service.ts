import { User } from '@zro/users/domain';
import { Cashback } from '@zro/otc/domain';
import { Currency, Wallet } from '@zro/operations/domain';

export interface OtcService {
  /**
   * Call Otc for creating cashback.
   * @param id The cashback id.
   * @returns Cashback created.
   */
  createCashback(
    id: string,
    user: User,
    wallet: Wallet,
    baseCurrency: Currency,
    amountCurrency: Currency,
    amount: number,
    description: string,
  ): Promise<Cashback>;
}
