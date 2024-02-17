import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import { PixDepositRepository, PixDeposit } from '@zro/pix-payments/domain';

export class GetPixDepositByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param depositRepository PixDeposit repository.
   */
  constructor(
    private logger: Logger,
    private readonly depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({ context: GetPixDepositByIdUseCase.name });
  }

  /**
   * Get PixDeposit by id.
   *
   * @param id PixDeposit id.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns PixDeposit data.
   */
  async execute(id: string, user?: User, wallet?: Wallet): Promise<PixDeposit> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get Deposit
    const pixDeposit = await this.depositRepository.getById(id);

    this.logger.debug('PixDeposit found.', { pixDeposit });

    if (
      !pixDeposit ||
      (user && user?.uuid !== pixDeposit.user.uuid) ||
      (wallet && wallet?.uuid !== pixDeposit.wallet.uuid)
    ) {
      return null;
    }

    return pixDeposit;
  }
}
