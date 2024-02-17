import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  TGetWalletInvitationsFilter,
  WalletInvitation,
  WalletInvitationRepository,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export class GetAllWalletInvitationByUserUseCase {
  private logger: Logger;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletInvitationRepository Wallet account repository.
   */
  constructor(
    logger: Logger,
    private walletInvitationRepository: WalletInvitationRepository,
  ) {
    this.logger = logger.child({
      context: GetAllWalletInvitationByUserUseCase.name,
    });
  }

  /**
   * Search wallet invitation by user.
   * @param pagination Pagination.
   * @param filter TGetWalletInvitationsFilter.
   * @param user User.
   * @returns Wallet invitation if found or null otherwise.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(
    pagination: Pagination,
    filter: TGetWalletInvitationsFilter,
    user: User,
  ): Promise<TPaginationResponse<WalletInvitation>> {
    // Data input check
    if (!user?.uuid) {
      throw new MissingDataException(['User']);
    }

    // Search wallet invitation.
    const walletInvitation =
      await this.walletInvitationRepository.getByUserAndFilter(
        pagination,
        filter,
        user,
      );

    this.logger.debug('Found wallet invitation.', { walletInvitation });

    return walletInvitation;
  }
}
