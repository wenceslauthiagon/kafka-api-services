import { Logger } from 'winston';
import {
  WalletInvitationState,
  WalletInvitationRepository,
} from '@zro/operations/domain';
import { getMoment } from '@zro/common';

export class SyncPendingExpiredWalletInvitationUseCase {
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
      context: SyncPendingExpiredWalletInvitationUseCase.name,
    });
  }

  /**
   * Sync expired pending wallet invitation.
   *
   * @returns Wallet invitation if found or null otherwise.
   *
   */
  async execute(): Promise<void> {
    const states = [WalletInvitationState.PENDING];
    const now = getMoment().toDate();

    // Search for walletInvitations with expiredAt less than timestamp
    const walletInvitations =
      await this.walletInvitationRepository.getByExpiredAtLessThanAndStateIn(
        now,
        states,
      );

    this.logger.debug('Found wallet invitations.', { walletInvitations });

    if (!walletInvitations.length) return;

    const promises = walletInvitations.map((walletInvitation) => {
      walletInvitation.state = WalletInvitationState.EXPIRED;
      return this.walletInvitationRepository.update(walletInvitation);
    });

    await Promise.all(promises);

    this.logger.debug('Wallet invitations updated.', { walletInvitations });
  }
}
