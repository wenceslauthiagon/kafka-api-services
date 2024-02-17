import { CryptoOrder, Remittance } from '@zro/otc/domain';

export interface OtcBotService {
  /**
   * Call otc-bot for update Otc Bot order by remittance.
   * @param cryptoOrder Crypto Order.
   * @param remittance  Remittace.
   */
  updateBotOtcOrderByRemittance(
    cryptoOrder: CryptoOrder,
    remittance: Remittance,
  ): Promise<void>;
}
