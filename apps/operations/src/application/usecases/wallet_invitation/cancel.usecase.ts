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
  WalletInvitationInvalidStateException,
  WalletInvitationIsExpiredException,
} from '@zro/operations/application';

export class CancelWalletInvitationUseCase {
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
      context: CancelWalletInvitationUseCase.name,
    });
  }

  /**
   * Cancel wallet invitation.
   * @param id Wallet invitation ID.
   * @param user User.
   * @returns Wallet invitation created.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(id: string, user: User): Promise<WalletInvitation> {
    // Data input check
    if (!id || !user?.uuid) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User ID'] : []),
      ]);
    }

    // Check if exists invite
    const walletInvitationFound =
      await this.walletInvitationRepository.getByIdAndUser(id, user);

    this.logger.debug('Wallet invitation found.', { walletInvitationFound });

    if (!walletInvitationFound) {
      throw new WalletInvitationNotFoundException({ id });
    }

    // Indepotent
    if (walletInvitationFound.isAlreadyCanceledWalletInvitation()) {
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

    walletInvitationFound.state = WalletInvitationState.CANCELED;
    walletInvitationFound.deletedAt = new Date();

    await this.walletInvitationRepository.update(walletInvitationFound);

    this.logger.debug('Wallet invitation canceled.', { walletInvitationFound });

    return walletInvitationFound;
  }
}
