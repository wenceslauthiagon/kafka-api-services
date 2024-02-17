import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Wallet,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { WalletCannotBeDeletedException } from '@zro/operations/application';

export class DeleteUserWalletUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(
    private logger: Logger,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({ context: DeleteUserWalletUseCase.name });
  }

  /**
   * Delete userWallet. Only owner wallet can delete a user wallet.
   *
   * @param owner User.
   * @param user User.
   * @param wallet Wallet.
   * @returns UserWallet found.
   */
  async execute(ownerWallet: User, user: User, wallet: Wallet): Promise<void> {
    // Data input check
    if (!ownerWallet?.uuid || !user?.uuid || !wallet?.uuid) {
      throw new MissingDataException([
        ...(!ownerWallet?.uuid ? ['Owner Wallet UUID'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
        ...(!wallet?.uuid ? ['Wallet UUID'] : []),
      ]);
    }

    // Search wallet.
    const walletFound = await this.walletRepository.getByUuid(wallet.uuid);

    this.logger.debug('Wallet found.', { wallet: walletFound });

    // Check if wallet exists.
    if (!walletFound) {
      return;
    }

    // Check if owner wallet received is wallet owner.
    if (walletFound.user.uuid !== ownerWallet.uuid) {
      return;
    }

    // It is not possible for the wallet owner to delete your wallet permission.
    if (walletFound.user.uuid === user.uuid) {
      throw new WalletCannotBeDeletedException(walletFound);
    }

    // Search userWallet.
    const userWalletFound = await this.userWalletRepository.getByUserAndWallet(
      user,
      wallet,
    );

    this.logger.debug('User wallet found.', { userWalletFound });

    // Check if user has this wallet permission.
    if (!userWalletFound) {
      return;
    }

    const result = await this.userWalletRepository.deleteByUserAndWallet(
      user,
      wallet,
    );

    this.logger.debug('User wallet deleted.', { result });
  }
}
