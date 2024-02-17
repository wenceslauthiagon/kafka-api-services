import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { WalletRepository, Wallet } from '@zro/operations/domain';
import { User } from '@zro/users/domain';

export class GetAllWalletByUserUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param walletRepository Wallet repository.
   * @param userService User service.
   */
  constructor(
    private logger: Logger,
    private readonly walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({
      context: GetAllWalletByUserUseCase.name,
    });
  }

  /**
   * List all wallets by user.
   *
   * @param wallet User.
   * @param pagination Pagination.
   * @param filter TGetWalletAccountFilter.
   * @returns WalletAccounts found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User): Promise<Wallet[]> {
    // Data input check
    if (!user?.uuid) {
      throw new MissingDataException(['User']);
    }

    // Search wallets
    const wallets = await this.walletRepository.getAllByUser(user);

    this.logger.debug('Wallets found.', { wallets });

    return wallets;
  }
}
