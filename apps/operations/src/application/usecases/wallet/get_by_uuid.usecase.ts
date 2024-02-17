import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Wallet, WalletRepository } from '@zro/operations/domain';

export class GetWalletByUuidUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param walletRepository Wallet repository.
   */
  constructor(
    private logger: Logger,
    private readonly walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({ context: GetWalletByUuidUseCase.name });
  }

  /**
   * Get the Wallet by uuid.
   *
   * @param uuid Wallet uuid.
   * @returns Wallet found.
   */
  async execute(uuid: string): Promise<Wallet> {
    // Data input check
    if (!uuid) {
      throw new MissingDataException(['UUID']);
    }

    // Search wallet
    const result = await this.walletRepository.getByUuid(uuid);

    this.logger.debug('Wallet found.', { result });

    return result;
  }
}
