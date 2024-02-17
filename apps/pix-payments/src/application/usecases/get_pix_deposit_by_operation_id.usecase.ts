import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import { PixDepositRepository, PixDeposit } from '@zro/pix-payments/domain';

export class GetPixDepositByOperationIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param depositRepository PixDeposit repository.
   */
  constructor(
    private logger: Logger,
    private readonly depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDepositByOperationIdUseCase.name,
    });
  }

  /**
   * Get PixDeposit by operation.
   *
   * @param operation PixDeposit operation.
   * @param wallet PixDeposit wallet.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns PixDeposit data.
   */
  async execute(
    operation: Operation,
    user?: User,
    wallet?: Wallet,
  ): Promise<PixDeposit> {
    // Data input check
    if (!operation?.id) {
      throw new MissingDataException(['Operation']);
    }

    // Get Deposit
    const pixDeposit = await this.depositRepository.getByOperation(operation);

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
