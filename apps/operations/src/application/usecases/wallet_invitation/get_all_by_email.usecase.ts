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

export class GetAllWalletInvitationByEmailUseCase {
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
      context: GetAllWalletInvitationByEmailUseCase.name,
    });
  }

  /**
   * Search wallet invitation by user.
   * @param pagination Pagination.
   * @param filter TGetWalletInvitationsFilter.
   * @param email email.
   * @returns Wallet invitation if found or null otherwise.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(
    pagination: Pagination,
    filter: TGetWalletInvitationsFilter,
    email: string,
  ): Promise<TPaginationResponse<WalletInvitation>> {
    // Data input check
    if (!email) {
      throw new MissingDataException(['Email']);
    }

    // Search wallet invitation.
    const walletInvitation =
      await this.walletInvitationRepository.getByEmailAndFilterAndNotExpired(
        pagination,
        filter,
        email,
      );

    this.logger.debug('Found wallet invitation.', { walletInvitation });

    return walletInvitation;
  }
}
