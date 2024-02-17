import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  UserWalletRepository,
  Wallet,
  WalletAccountCacheRepository,
  WalletAccountRepository,
  WalletAccountState,
  WalletRepository,
  WalletState,
} from '@zro/operations/domain';
import {
  WalletCannotBeDeletedException,
  WalletNotFoundException,
  WalletAccountHasBalanceException,
  WalletNotActiveException,
  CreateP2PTransferUseCase,
} from '@zro/operations/application';

export class DeleteWalletByUuidAndUserUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletRepository Wallet repository.
   * @param walletAccountRepository Wallet account repository.
   * @param walletAccountCacheRepository WalletAccountCache repository.
   * @param userWalletRepository User wallet repository.
   * @param createP2PTransfer Create p2p transfer usecase.
   */
  constructor(
    private logger: Logger,
    private readonly walletRepository: WalletRepository,
    private readonly walletAccountRepository: WalletAccountRepository,
    private readonly walletAccountCacheRepository: WalletAccountCacheRepository,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly createP2PTransfer: CreateP2PTransferUseCase,
  ) {
    this.logger = logger.child({
      context: DeleteWalletByUuidAndUserUseCase.name,
    });
  }

  /**
   * Delete wallet by user.
   *
   * @returns Wallet deleted.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(
    uuid: string,
    user: User,
    walletBackup?: Wallet,
  ): Promise<void> {
    // Data input check
    if (!uuid || !user?.uuid) {
      throw new MissingDataException([
        ...(!uuid ? ['UUID'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
      ]);
    }

    const wallet = await this.walletRepository.getByUuid(uuid);

    this.logger.debug('Wallet found.', { wallet });

    if (!wallet) {
      throw new WalletNotFoundException({ uuid });
    }

    if (wallet.user.uuid !== user.uuid) {
      throw new WalletNotFoundException(wallet);
    }

    // Check indepotent.
    if (wallet.state === WalletState.DEACTIVATE) {
      return;
    }

    // Is it a default wallet?
    if (wallet.default) {
      this.logger.debug('User cannot delete default wallet.', { wallet });
      throw new WalletCannotBeDeletedException(wallet);
    }

    // Is there any wallet account with a non-zero balance?
    const walletAccounts =
      await this.walletAccountCacheRepository.getAllByWallet(wallet);

    const activeWalletAccounts = walletAccounts.filter(
      (item) => item.state === WalletAccountState.ACTIVE,
    );

    // Check if there is a walletAccount with non-zero balance.
    const walletAccountsWithBalance = activeWalletAccounts.filter(
      (item) => item.balance !== 0,
    );

    if (walletAccountsWithBalance.length) {
      this.logger.debug('WalletAccounts with non-zero balance.', {
        walletAccountsWithBalance,
      });

      const walletBackupNotHasProvided = !walletBackup?.uuid;

      if (walletBackupNotHasProvided) {
        throw new WalletAccountHasBalanceException(walletAccountsWithBalance);
      }

      const walletBackupFound = await this.getWalletBackupByUser(
        walletBackup.uuid,
        user,
      );

      for (const walletAccountWithBalance of walletAccountsWithBalance) {
        await this.createP2PTransfer.execute(
          uuidV4(),
          user,
          wallet,
          walletBackupFound,
          walletAccountWithBalance.currency,
          walletAccountWithBalance.balance,
        );
      }
    }

    // Disable wallet accounts.
    await Promise.all(
      activeWalletAccounts.map(async (item) =>
        this.walletAccountRepository.update({
          ...item,
          state: WalletAccountState.DEACTIVATE,
        }),
      ),
    );

    // Disable wallet.
    wallet.state = WalletState.DEACTIVATE;
    const result = await this.walletRepository.update(wallet);

    this.logger.debug('Wallet disabled.', { result });

    // Delete UserWallet by wallet.
    const userWallets = await this.userWalletRepository.deleteByWallet(wallet);

    this.logger.debug('UserWallets deleted.', { userWallets });
  }

  async getWalletBackupByUser(uuid: string, user: User): Promise<Wallet> {
    const wallet = await this.walletRepository.getByUuid(uuid);

    this.logger.debug('Wallet found.', { wallet });

    if (!wallet) {
      throw new WalletNotFoundException({ uuid });
    }

    const walletNotIsFromUser = wallet.user.uuid !== user.uuid;

    if (walletNotIsFromUser) {
      throw new WalletNotFoundException(wallet);
    }

    const walletNotIsActive = wallet.state === WalletState.DEACTIVATE;

    if (walletNotIsActive) {
      throw new WalletNotActiveException(wallet);
    }

    return wallet;
  }
}
