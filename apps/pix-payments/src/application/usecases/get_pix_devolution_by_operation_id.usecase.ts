import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  PixDevolutionRepository,
  PixDevolution,
  PixDepositRepository,
} from '@zro/pix-payments/domain';
import { PixDepositNotFoundException } from '@zro/pix-payments/application';
import { User } from '@zro/users/domain';

export class GetPixDevolutionByOperationIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionRepository PixDevolution repository.
   * @param depositRepository PixDeposit repository.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionRepository: PixDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDevolutionByOperationIdUseCase.name,
    });
  }

  /**
   * Get PixDevolution with PixDeposit by operation.
   *
   * @param operation PixDevolution operation.
   * @param wallet PixDevolution user.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns PixDevolution data.
   */
  async execute(
    operation: Operation,
    user?: User,
    wallet?: Wallet,
  ): Promise<PixDevolution> {
    // Data input check
    if (!operation?.id) {
      throw new MissingDataException(['Operation']);
    }

    // Get PixDevolution
    const devolution =
      await this.devolutionRepository.getByOperation(operation);

    this.logger.debug('PixDevolution found.', { devolution });

    if (
      !devolution ||
      (user && user?.uuid !== devolution.user.uuid) ||
      (wallet && wallet?.uuid !== devolution.wallet.uuid)
    ) {
      return null;
    }

    const deposit = await this.depositRepository.getById(devolution.deposit.id);

    this.logger.debug('PixDeposit found.', { deposit });

    if (!deposit) {
      throw new PixDepositNotFoundException({ id: devolution.deposit.id });
    }

    devolution.deposit = deposit;

    return devolution;
  }
}
