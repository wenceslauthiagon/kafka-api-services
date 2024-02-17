import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import {
  PixDevolution,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export class GetPixDevolutionByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixDevolution repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixDevolutionRepository,
  ) {
    this.logger = logger.child({ context: GetPixDevolutionByIdUseCase.name });
  }

  /**
   * Get PixDevolution by id.
   *
   * @param id PixDevolution id.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns PixDevolution data.
   */
  async execute(
    id: string,
    user?: User,
    wallet?: Wallet,
  ): Promise<PixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get PixDevolution
    const devolution = await this.repository.getWithDepositById(id);

    this.logger.debug('PixDevolution found.', { devolution });

    if (
      !devolution ||
      (user && user?.uuid !== devolution.user.uuid) ||
      (wallet && wallet?.uuid !== devolution.wallet.uuid)
    ) {
      return null;
    }

    return devolution;
  }
}
