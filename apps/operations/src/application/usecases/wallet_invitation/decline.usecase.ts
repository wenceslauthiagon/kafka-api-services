import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  WalletInvitation,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  WalletInvitationNotFoundException,
  WalletInvitationNotPermittedException,
  WalletInvitationInvalidStateException,
  WalletInvitationIsExpiredException,
} from '@zro/operations/application';

export class DeclineWalletInvitationUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletInvitationRepository Wallet invitation repository.
   */
  constructor(
    private logger: Logger,
    private readonly walletInvitationRepository: WalletInvitationRepository,
  ) {
    this.logger = logger.child({
      context: DeclineWalletInvitationUseCase.name,
    });
  }

  /**
   * Decline wallet invitation.
   * @param id Wallet invitation ID.
   * @param user User.
   * @returns Wallet invitation created.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(id: string, user: User): Promise<WalletInvitation> {
    // Data input check
    if (!id || !user?.email) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.email ? ['Contact Information Email'] : []),
      ]);
    }

    // Check if exists invite
    const walletInvitationFound =
      await this.walletInvitationRepository.getById(id);

    this.logger.debug('Wallet invitation found.', { walletInvitationFound });

    if (!walletInvitationFound) {
      throw new WalletInvitationNotFoundException({ id });
    }

    // Indepotent
    if (walletInvitationFound.isAlreadyDeclinedWalletInvitation()) {
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
    if (user.email !== walletInvitationFound.email) {
      throw new WalletInvitationNotPermittedException(walletInvitationFound);
    }

    walletInvitationFound.state = WalletInvitationState.DECLINED;
    walletInvitationFound.declinedAt = new Date();

    await this.walletInvitationRepository.update(walletInvitationFound);

    this.logger.debug('Wallet invitation declined.', { walletInvitationFound });

    return walletInvitationFound;
  }
}
