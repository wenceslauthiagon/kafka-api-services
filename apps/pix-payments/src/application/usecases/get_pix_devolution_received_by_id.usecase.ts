import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import {
  PixDevolutionReceived,
  PixDevolutionReceivedRepository,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export class GetPixDevolutionReceivedByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixDevolutionReceived repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixDevolutionReceivedRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDevolutionReceivedByIdUseCase.name,
    });
  }

  /**
   * Get PixDevolutionReceived by id.
   *
   * @param id PixDevolutionReceived id.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns PixDevolutionReceived data.
   */
  async execute(
    id: string,
    user?: User,
    wallet?: Wallet,
  ): Promise<PixDevolutionReceived> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get PixDevolutionReceived
    const devolution = await this.repository.getById(id);

    this.logger.debug('PixDevolutionReceived found.', { devolution });

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
