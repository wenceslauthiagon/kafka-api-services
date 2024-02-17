import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  Wallet,
  WalletAccount,
  WalletAccountRepository,
} from '@zro/operations/domain';

export class GetWalletAccountByWalletAndUuidUseCase {
  private logger: Logger;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletAccountRepository Wallet account repository.
   */
  constructor(
    logger: Logger,
    private walletAccountRepository: WalletAccountRepository,
  ) {
    this.logger = logger.child({
      context: GetWalletAccountByWalletAndUuidUseCase.name,
    });
  }

  /**
   * Search wallet account by wallet and uuid.
   *
   * @param wallet Wallet.
   * @param uuid Wallet account uuid.
   * @returns Wallet account if found or null otherwise.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(
    wallet: Wallet,
    uuid: WalletAccount['uuid'],
  ): Promise<WalletAccount> {
    // Data input check
    if (!wallet?.uuid || !uuid) {
      throw new MissingDataException([
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!uuid ? ['Uuid'] : []),
      ]);
    }

    const walletAccount = await this.walletAccountRepository.getByWalletAndUuid(
      wallet,
      uuid,
    );

    this.logger.debug('Found wallet account.', { walletAccount });

    return walletAccount;
  }
}
