import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  UserWallet,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import {
  UserService,
  WalletNotFoundException,
} from '@zro/operations/application';
import { UserNotFoundException } from '@zro/users/application';

export enum OwnerType {
  USER = 'USER',
  OTHER = 'OTHER',
}

export type TGetAllUserWalletByUserFilters = {
  owner: OwnerType;
};

export class GetAllUserWalletByUserUseCase {
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
    this.logger = logger.child({ context: GetAllUserWalletByUserUseCase.name });
  }

  /**
   * Get the UserWallet by id.
   *
   * @param user User.
   * @param filters Filters.
   * @returns UserWallet found.
   */
  async execute(
    user: User,
    filters?: TGetAllUserWalletByUserFilters,
  ): Promise<UserWallet[]> {
    // Data input check
    if (!user?.uuid) {
      throw new MissingDataException(['User UUID']);
    }

    // Search by userWallet.
    const result = await this.userWalletRepository.getAllByUser(user);

    this.logger.debug('User wallets found.', { result });

    for (const userWallet of result) {
      const wallet = await this.walletRepository.getByUuid(
        userWallet.wallet.uuid,
      );

      if (!wallet) {
        throw new WalletNotFoundException(userWallet.wallet);
      }

      userWallet.wallet = wallet;

      // Set default wallet when user is wallet owner.
      userWallet.wallet.default =
        userWallet.wallet.default && userWallet.wallet.user.uuid === user.uuid;

      // Search user.
      const ownerInformations = await this.userService.getUserByUuid({
        userId: userWallet.wallet.user.uuid,
      });

      if (!ownerInformations) {
        this.logger.debug('User not found by wallet.', {
          wallet: userWallet.wallet,
        });
        throw new UserNotFoundException(userWallet.wallet.user);
      }

      userWallet.wallet.user = new UserEntity(ownerInformations);
    }

    this.logger.debug('User wallets found.', { result });

    if (!filters) {
      return result;
    }

    if (filters.owner === OwnerType.USER) {
      return result.filter(
        (userWallet) => userWallet.wallet.user.uuid === user.uuid,
      );
    }

    if (filters.owner === OwnerType.OTHER) {
      return result.filter(
        (userWallet) => userWallet.wallet.user.uuid !== user.uuid,
      );
    }
  }
}
