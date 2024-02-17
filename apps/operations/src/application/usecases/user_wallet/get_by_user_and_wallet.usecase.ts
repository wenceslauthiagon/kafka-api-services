import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Wallet,
  UserWallet,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';

export class GetUserWalletByUserAndWalletUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param walletRepository Wallet repository.
   * @param userWalletRepository UserWallet repository.
   * @param userService  User service.
   */
  constructor(
    private logger: Logger,
    private readonly walletRepository: WalletRepository,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetUserWalletByUserAndWalletUseCase.name,
    });
  }

  /**
   * Get the UserWallet by User and Wallet.
   *
   * @param user User.
   * @param wallet Wallet.
   * @returns UserWallet found.
   */
  async execute(user: User, wallet: Wallet): Promise<UserWallet> {
    // Data input check
    if (!user?.uuid || !wallet?.uuid) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User UUID'] : []),
        ...(!wallet?.uuid ? ['Wallet UUID'] : []),
      ]);
    }

    // Search userWallet.
    const result = await this.userWalletRepository.getByUserAndWallet(
      user,
      wallet,
    );

    if (!result) {
      this.logger.debug('User wallet found.', { result });

      return null;
    }

    result.wallet = await this.walletRepository.getByUuid(result.wallet.uuid);

    // Search user.
    const ownerInformations = await this.userService.getUserByUuid({
      userId: result.wallet.user.uuid,
    });

    result.wallet.user = new UserEntity(ownerInformations);

    this.logger.debug('User wallet found.', { result });

    return result;
  }
}
