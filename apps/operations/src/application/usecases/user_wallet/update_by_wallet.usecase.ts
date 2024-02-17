import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Wallet,
  UserWalletRepository,
  PermissionType,
  UserWallet,
  WalletRepository,
} from '@zro/operations/domain';
import {
  UserService,
  UserWalletAlreadyExistsException,
  UserWalletNotFoundException,
  WalletNotFoundException,
} from '@zro/operations/application';
import { UserNotFoundException } from '@zro/users/application';

export class UpdateUserWalletByWalletUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(
    private logger: Logger,
    private readonly walletRepository: WalletRepository,
    private readonly userWalletRepository: UserWalletRepository,
    private readonly userService: UserService,
    private readonly permissionRootTag: string,
  ) {
    this.logger = logger.child({
      context: UpdateUserWalletByWalletUseCase.name,
    });
  }

  /**
   * Update userWallet. Only owner wallet can update it.
   *
   * @param owner User.
   * @param user User.
   * @param wallet Wallet.
   * @param permissionTypes PermissionTypes.
   * @returns UserWallet updated.
   */
  async execute(
    ownerWallet: User,
    user: User,
    wallet: Wallet,
    permissionTypes: PermissionType[],
  ): Promise<UserWallet> {
    // Data input check
    if (
      !ownerWallet?.uuid ||
      !user?.uuid ||
      !wallet?.uuid ||
      !permissionTypes?.length
    ) {
      throw new MissingDataException([
        ...(!ownerWallet?.uuid ? ['Owner Wallet UUID'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
        ...(!wallet?.uuid ? ['Wallet UUID'] : []),
        ...(!permissionTypes?.length ? ['Permission Types'] : []),
      ]);
    }

    // Permission ROOT can't be used to update a permission.
    if (permissionTypes.some((i) => i.tag === this.permissionRootTag)) {
      throw new MissingDataException(['Permission Type invalid']);
    }

    // Search wallet.
    const walletFound = await this.walletRepository.getByUuid(wallet.uuid);

    this.logger.debug('Wallet found.', { walletFound });

    // Check if wallet exists.
    if (!walletFound || walletFound.user.uuid !== ownerWallet.uuid) {
      throw new WalletNotFoundException(wallet);
    }

    // It is not possible for the wallet owner to update your wallet permission.
    if (walletFound.user.uuid === user.uuid) {
      throw new UserWalletAlreadyExistsException({ user, wallet });
    }

    // Search userWallet.
    const userWallet = await this.userWalletRepository.getByUserAndWallet(
      user,
      wallet,
    );

    this.logger.debug('User wallet found.', { userWallet });

    if (!userWallet) {
      throw new UserWalletNotFoundException({ user, wallet });
    }

    // Search user.
    const ownerInformations = await this.userService.getUserByUuid({
      userId: userWallet.user.uuid,
    });

    if (!ownerInformations) {
      this.logger.debug('User not found by id.', { user: userWallet.user });
      throw new UserNotFoundException(userWallet.user);
    }
    userWallet.user = new UserEntity(ownerInformations);

    // Check if user has root permission for this wallet.
    if (
      userWallet.permissionTypes.some((i) => i.tag === this.permissionRootTag)
    ) {
      return userWallet;
    }

    userWallet.permissionTypes = permissionTypes;
    const result = await this.userWalletRepository.update(userWallet);

    this.logger.debug('User wallet updated.', { result });

    return result;
  }
}
