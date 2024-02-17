import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  Currency,
  CurrencyRepository,
  Wallet,
  WalletAccount,
  WalletAccountRepository,
} from '@zro/operations/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';

export class GetWalletAccountByWalletAndCurrencyUseCase {
  private logger: Logger;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletAccountRepository Wallet account repository.
   * @param currencyRepository Currency repository.
   */
  constructor(
    logger: Logger,
    private walletAccountRepository: WalletAccountRepository,
    private currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({
      context: GetWalletAccountByWalletAndCurrencyUseCase.name,
    });
  }

  /**
   * Search wallet account by wallet and currency.
   *
   * @param wallet Wallet.
   * @param currency Currency.
   * @returns Wallet account if found or null otherwise.
   *
   * @throws {MissingDataException} If any parameter is missing.
   * @throws {CurrencyNotFoundException} If currency was not found in database.
   */
  async execute(wallet: Wallet, currency: Currency): Promise<WalletAccount> {
    // Data input check
    if (!wallet?.uuid || !currency?.tag) {
      throw new MissingDataException([
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!currency?.tag ? ['Currency'] : []),
      ]);
    }

    // Search currency.
    const currencyFound = await this.currencyRepository.getByTag(currency.tag);

    if (!currencyFound) {
      throw new CurrencyNotFoundException(currency);
    }

    this.logger.debug('Found currency.', { currency: currencyFound });

    const walletAccount =
      await this.walletAccountRepository.getByWalletAndCurrency(
        wallet,
        currencyFound,
      );

    this.logger.debug('Found wallet account.', { walletAccount });

    return walletAccount;
  }
}
