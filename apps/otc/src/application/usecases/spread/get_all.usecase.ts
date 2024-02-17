import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import { Spread, SpreadRepository } from '@zro/otc/domain';

export class GetAllSpreadUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param spreadRepository Spread repository.
   */
  constructor(
    private logger: Logger,
    private readonly spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({
      context: GetAllSpreadUseCase.name,
    });
  }

  /**
   * List all spreads.
   *
   * @returns {Spread[]} Spread found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(pagination: Pagination): Promise<TPaginationResponse<Spread>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search spreads
    const spreadsFound = await this.spreadRepository.getAll(pagination);

    this.logger.debug('Found spreads.', { spread: spreadsFound });

    return spreadsFound;
  }
}
