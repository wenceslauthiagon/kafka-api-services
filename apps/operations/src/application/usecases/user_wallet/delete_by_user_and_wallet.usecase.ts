import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Wallet,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { WalletCannotBeDeletedException } from '@zro/operations/application';

export class DeleteUserWalletByUserAndWalletUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(
    private logger: Logger,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({
      context: DeleteUserWalletByUserAndWalletUseCase.name,
    });
  }

  /**
   * Delete userWallet. The user can delete a user wallet if he's not the owner wallet.
   *
   * @param user User.
   * @param wallet Wallet.
   * @returns UserWallet found.
   */
  async execute(user: User, wallet: Wallet): Promise<void> {
    // Data input check
    if (!user?.uuid || !wallet?.uuid) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User UUID'] : []),
        ...(!wallet?.uuid ? ['Wallet UUID'] : []),
      ]);
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

    // Search wallet.
    const walletFound = await this.walletRepository.getByUuid(wallet.uuid);

    this.logger.debug('Wallet found.', { wallet: walletFound });

    // Check if wallet exists.
    if (!walletFound) {
      return;
    }

    // It is not possible for wallet owner to delete his wallet permission.
    if (walletFound.user.uuid === user.uuid) {
      throw new WalletCannotBeDeletedException(walletFound);
    }

    const result = await this.userWalletRepository.deleteByUserAndWallet(
      user,
      wallet,
    );

    this.logger.debug('User wallet deleted.', { result });
  }
}
