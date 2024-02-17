import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  PixDevolutionRepository,
  PixDevolution,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import { Wallet } from '@zro/operations/domain';

export class GetAllPixDevolutionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionRepository PixDevolution repository.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionRepository: PixDevolutionRepository,
  ) {
    this.logger = logger.child({ context: GetAllPixDevolutionUseCase.name });
  }

  /**
   * Get all PixDevolution.
   *
   * @returns PixDevolutions found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
    states?: PixDevolutionState[],
  ): Promise<TPaginationResponse<PixDevolution>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Get Devolutions
    const pixDevolutions = await this.devolutionRepository.getAllWithDeposit(
      pagination,
      user,
      wallet,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
      states,
    );

    this.logger.debug('Found devolutions.', { pixDevolutions });

    return pixDevolutions;
  }
}
