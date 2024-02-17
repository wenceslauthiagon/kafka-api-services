import { User } from '@zro/users/domain';
import { Spread } from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';

export interface OtcService {
  getSpreadsByUserAndCurrencies: (
    user: User,
    currencies: Currency[],
  ) => Promise<Spread[]>;
}
