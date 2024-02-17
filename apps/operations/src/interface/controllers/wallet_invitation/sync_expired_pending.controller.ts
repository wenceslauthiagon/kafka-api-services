import { Logger } from 'winston';
import { WalletInvitationRepository } from '@zro/operations/domain';
import { SyncPendingExpiredWalletInvitationUseCase as UseCase } from '@zro/operations/application';

export class SyncPendingExpiredWalletInvitationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletInvitationRepository: WalletInvitationRepository,
  ) {
    this.logger = logger.child({
      context: SyncPendingExpiredWalletInvitationController.name,
    });

    this.usecase = new UseCase(this.logger, walletInvitationRepository);
  }

  /**
   * Sync expired pending wallet invitation.
   */
  async execute(): Promise<void> {
    this.logger.debug('Sync pending expired wallet invitation request.');

    await this.usecase.execute();
  }
}
