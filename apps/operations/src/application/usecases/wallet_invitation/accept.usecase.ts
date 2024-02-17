import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  UserWalletEntity,
  UserWalletRepository,
  WalletInvitation,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import {
  WalletInvitationNotFoundException,
  WalletInvitationNotPermittedException,
  WalletInvitationInvalidStateException,
  WalletInvitationInvalidCodeConfirmException,
  WalletInvitationIsExpiredException,
  UserWalletAlreadyExistsException,
} from '@zro/operations/application';

export class AcceptWalletInvitationUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletInvitationRepository Wallet invitation repository.
   */
  constructor(
    private logger: Logger,
    private readonly walletInvitationRepository: WalletInvitationRepository,
    private readonly userWalletRepository: UserWalletRepository,
  ) {
    this.logger = logger.child({ context: AcceptWalletInvitationUseCase.name });
  }

  /**
   * Accept wallet invitation.
   * @param id Wallet invitation ID.
   * @param confirmCode Wallet invitation confirmCode.
   * @param user User.
   * @returns Wallet invitation created.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(
    id: string,
    confirmCode: string,
    user: User,
  ): Promise<WalletInvitation> {
    // Data input check
    if (!id || !confirmCode || !user?.uuid || !user?.email) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!confirmCode ? ['Code confirm'] : []),
        ...(!user?.uuid ? ['User ID'] : []),
        ...(!user?.email ? ['Contact Information Email'] : []),
      ]);
    }

    // Check if exists invite
    const walletInvitationFound =
      await this.walletInvitationRepository.getById(id);

    this.logger.debug('Wallet invitation found.', {
      walletInvitation: walletInvitationFound,
    });

    if (!walletInvitationFound) {
      throw new WalletInvitationNotFoundException({ id });
    }

    // Indepotent
    if (walletInvitationFound.isAlreadyAcceptedWalletInvitation()) {
      return walletInvitationFound;
    }

    // Only PENDING walletInvitation is accept.
    if (walletInvitationFound.state !== WalletInvitationState.PENDING) {
      throw new WalletInvitationInvalidStateException(walletInvitationFound);
    }

    // Check if invite is expired
    if (walletInvitationFound.isExpiredWalletInvitation()) {
      throw new WalletInvitationIsExpiredException(walletInvitationFound);
    }

    // Check if this invite exists for this user
    if (user?.email !== walletInvitationFound.email) {
      throw new WalletInvitationNotPermittedException(walletInvitationFound);
    }

    // Check confirm code
    if (walletInvitationFound.confirmCode !== confirmCode) {
      throw new WalletInvitationInvalidCodeConfirmException(confirmCode);
    }

    // Check if this wallet already exists
    const userWalletFound = await this.userWalletRepository.getByUserAndWallet(
      user,
      walletInvitationFound.wallet,
    );

    this.logger.debug('User Wallet invitation found.', {
      userWallet: userWalletFound,
    });

    if (userWalletFound) {
      throw new UserWalletAlreadyExistsException(userWalletFound);
    }

    walletInvitationFound.state = WalletInvitationState.ACCEPTED;
    walletInvitationFound.acceptedAt = new Date();

    await this.walletInvitationRepository.update(walletInvitationFound);

    this.logger.debug('Wallet invitation accepted.', { walletInvitationFound });

    // Add user to wallet
    const userWalletCreated = new UserWalletEntity({
      id: uuidV4(),
      user,
      wallet: walletInvitationFound.wallet,
      permissionTypes: walletInvitationFound.permissionTypes,
    });

    await this.userWalletRepository.create(userWalletCreated);

    this.logger.debug('UserWallet created.', { userWallet: userWalletCreated });

    return walletInvitationFound;
  }
}
