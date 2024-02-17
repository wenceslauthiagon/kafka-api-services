import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Wallet,
  UserWallet,
  UserWalletRepository,
} from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';

export class GetAllUserWalletByUserAndWalletUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWalletRepository UserWallet repository.
   * @param userService  User service.
   */
  constructor(
    private logger: Logger,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetAllUserWalletByUserAndWalletUseCase.name,
    });
  }

  /**
   * Get the UserWallets by User and Wallet.
   *
   * @param user User.
   * @param wallet Wallet.
   * @returns UserWallet permissions found.
   */
  async execute(user: User, wallet: Wallet): Promise<UserWallet[]> {
    // Data input check
    if (!user?.uuid || !wallet?.uuid) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User UUID'] : []),
        ...(!wallet?.uuid ? ['Wallet UUID'] : []),
      ]);
    }

    // Search userWallet.
    const userWallet = await this.userWalletRepository.getByUserAndWallet(
      user,
      wallet,
    );

    if (!userWallet) {
      this.logger.debug('User wallet found.', { userWallet });

      return [];
    }

    const userWallets = await this.userWalletRepository.getAllByWallet(wallet);

    for (const item of userWallets) {
      // Search user.
      const userInformations = await this.userService.getUserByUuid({
        userId: item.user.uuid,
      });

      item.user = new UserEntity(userInformations);
    }

    this.logger.debug('User wallets found.', { userWallets });

    return userWallets;
  }
}
