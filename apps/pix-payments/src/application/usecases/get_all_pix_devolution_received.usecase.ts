import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
  PixDevolutionReceived,
} from '@zro/pix-payments/domain';
import { Wallet } from '@zro/operations/domain';

export class GetAllPixDevolutionReceivedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionReceivedRepository PixDevolution received repository.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
  ) {
    this.logger = logger.child({
      context: GetAllPixDevolutionReceivedUseCase.name,
    });
  }

  /**
   * Get all PixDevolutionReceived.
   *
   * @returns PixDevolutionsReceived found.
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
    states?: PixDevolutionReceivedState[],
  ): Promise<TPaginationResponse<PixDevolutionReceived>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Get Devolutions received
    const pixDevolutionsReceived =
      await this.devolutionReceivedRepository.getAll(
        pagination,
        user,
        wallet,
        createdAtPeriodStart,
        createdAtPeriodEnd,
        endToEndId,
        clientDocument,
        states,
      );

    this.logger.debug('Found devolutions received.', {
      pixDevolutionsReceived,
    });

    return pixDevolutionsReceived;
  }
}
