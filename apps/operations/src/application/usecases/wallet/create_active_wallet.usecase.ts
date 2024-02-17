import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, ForbiddenException } from '@zro/common';
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
import { WalletMaxNumberException } from '@zro/operations/application';

export class CreateActiveWalletUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletRepository Wallet repository.
   * @param walletAccountRepository Wallet account repository.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private logger: Logger,
    private readonly walletRepository: WalletRepository,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly walletMaxNumber: number,
    private readonly permissionRootTag: string,
  ) {
    this.logger = logger.child({ context: CreateActiveWalletUseCase.name });
  }

  /**
   * Create wallet by user.
   *
   * @param user User.
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(uuid: string, name: string, user: User): Promise<Wallet> {
    // Data input check
    if (!uuid || !name || !user?.id || !user?.uuid) {
      throw new MissingDataException([
        ...(!uuid ? ['UUID'] : []),
        ...(!name ? ['Name'] : []),
        ...(!user?.id ? ['User ID'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
      ]);
    }

    // Check indepotent.
    const walletFound = await this.walletRepository.getByUuid(uuid);

    if (walletFound) {
      this.logger.debug('Wallet already exists.', { walletFound });

      if (walletFound.user.uuid !== user.uuid) {
        throw new ForbiddenException();
      }
      return walletFound;
    }

    // Check number of wallets.
    const numberOfWallet =
      await this.walletRepository.countByUserAndStateIsNotDeactivate(user);

    if (numberOfWallet >= this.walletMaxNumber) {
      throw new WalletMaxNumberException(numberOfWallet);
    }

    const wallet = new WalletEntity({
      uuid,
      user,
      name,
      default: false,
      state: WalletState.ACTIVE,
    });

    const walletCreated = await this.walletRepository.create(wallet);

    this.logger.debug('Wallet created.', { walletCreated });

    // Create Wallet Accounts by currencies.
    const currencies = await this.currencyRepository.getAll();
    this.logger.debug('Currencies found.', { currencies });

    for (const currency of currencies) {
      const walletAccount = new WalletAccountEntity({
        uuid: uuidV4(),
        currency,
        wallet: walletCreated,
        state: WalletAccountState.ACTIVE,
      });

      const walletAccountCreated =
        await this.walletAccountRepository.create(walletAccount);

      this.logger.debug('Wallet Account created.', { walletAccountCreated });
    }

    const userWallet = new UserWalletEntity({
      id: uuidV4(),
      user,
      wallet: walletCreated,
      permissionTypes: [{ tag: this.permissionRootTag }],
    });

    await this.userWalletRepository.create(userWallet);

    return walletCreated;
  }
}
