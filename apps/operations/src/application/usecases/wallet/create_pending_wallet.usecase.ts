import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  CurrencyRepository,
  UserWalletEntity,
  UserWalletRepository,
  Wallet,
  WalletAccountEntity,
  WalletAccountRepository,
  WalletAccountState,
  WalletEntity,
  WalletRepository,
  WalletState,
} from '@zro/operations/domain';

export class CreatePendingWalletUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletRepository Wallet repository.
   * @param walletAccountRepository Wallet account repository.
   * @param currencyRepository Currency repository.
   * @param walletRepository Wallet repository.
   */
  constructor(
    private logger: Logger,
    private readonly walletRepository: WalletRepository,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly permissionRootTag: string,
  ) {
    this.logger = logger.child({ context: CreatePendingWalletUseCase.name });
  }

  /**
   * Create pending wallet by user.
   *
   * @param user User.
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(user: User): Promise<Wallet> {
    // Data input check
    if (!user?.id || !user?.uuid) {
      throw new MissingDataException([
        ...(!user?.id ? ['User ID'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
      ]);
    }

    // Check number of wallets.
    const userHasWallet =
      await this.walletRepository.countByUserAndStateIsNotDeactivate(user);

    if (userHasWallet) {
      this.logger.debug('Wallets already exist.', { userHasWallet });
      return;
    }

    const walletEntity = new WalletEntity({
      uuid: uuidV4(),
      user,
      default: true,
      state: WalletState.PENDING,
    });

    const walletCreated = await this.walletRepository.create(walletEntity);

    this.logger.debug('Wallet created.', { walletCreated });

    // Create Wallet Accounts by currencies.
    const currencies = await this.currencyRepository.getAll();
    this.logger.debug('Currencies found.', { currencies });

    for (const currency of currencies) {
      const walletAccountEntity = new WalletAccountEntity({
        uuid: uuidV4(),
        currency,
        wallet: walletCreated,
        state: WalletAccountState.PENDING,
      });

      const walletAccountCreated =
        await this.walletAccountRepository.create(walletAccountEntity);

      this.logger.debug('Wallet Account created.', { walletAccountCreated });
    }

    const userWallet = new UserWalletEntity({
      id: uuidV4(),
      user,
      wallet: walletCreated,
      permissionTypes: [{ tag: this.permissionRootTag }],
    });

    await this.userWalletRepository.create(userWallet);

    this.logger.debug('User wallet created.', { userWallet });

    return walletCreated;
  }
}
