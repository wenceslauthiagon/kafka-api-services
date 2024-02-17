import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet, WalletRepository, WalletState } from '@zro/operations/domain';
import {
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';

export class UpdateWalletByUuidAndUserUseCase {
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
      context: UpdateWalletByUuidAndUserUseCase.name,
    });
  }

  /**
   * Update wallet by root user.
   *
   * @returns Wallet updated.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(uuid: string, name: string, user: User): Promise<Wallet> {
    // Data input check
    if (!uuid || !name || !user?.uuid) {
      throw new MissingDataException([
        ...(!uuid ? ['UUID'] : []),
        ...(!name ? ['Name'] : []),
        ...(!user?.uuid ? ['User UUID'] : []),
      ]);
    }

    // Search wallet
    const wallet = await this.walletRepository.getByUuid(uuid);

    this.logger.debug('Wallet found.', { wallet });

    if (!wallet) {
      throw new WalletNotFoundException({ uuid });
    }
    if (wallet.user.uuid !== user.uuid) {
      throw new WalletNotFoundException(wallet);
    }
    if (wallet.state === WalletState.DEACTIVATE) {
      throw new WalletNotActiveException(wallet);
    }

    // Check indepotent.
    if (wallet.name === name) {
      return wallet;
    }

    wallet.name = name;

    const result = await this.walletRepository.update(wallet);

    this.logger.debug('Wallet updated.', { result });

    return result;
  }
}
