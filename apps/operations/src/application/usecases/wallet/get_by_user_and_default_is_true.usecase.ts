import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet, WalletRepository } from '@zro/operations/domain';

export class GetWalletByUserAndDefaultIsTrueUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletRepository Wallet repository.
   */
  constructor(
    private logger: Logger,
    private readonly walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({
      context: GetWalletByUserAndDefaultIsTrueUseCase.name,
    });
  }

  /**
   * Search wallet default by user.
   *
   * @param user User.
   * @returns Wallet if found or null otherwise.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(user: User): Promise<Wallet> {
    // Data input check
    if (!user?.uuid) {
      throw new MissingDataException(['User']);
    }

    const wallet = await this.walletRepository.getByUserAndDefaultIsTrue(user);

    this.logger.debug('Wallet found.', { wallet });

    return wallet;
  }
}
