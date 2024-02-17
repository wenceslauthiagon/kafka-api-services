import { Logger } from 'winston';
import { System, SystemRepository } from '@zro/otc/domain';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';

export class GetAllSystemUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param systemRepository System repository.
   */
  constructor(
    private logger: Logger,
    private readonly systemRepository: SystemRepository,
  ) {
    this.logger = logger.child({ context: GetAllSystemUseCase.name });
  }

  /**
   * List all Systems.
   *
   * @returns {System[]} Systems found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(pagination: Pagination): Promise<TPaginationResponse<System>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search systems
    const result = await this.systemRepository.getAll(pagination);

    this.logger.debug('Found systems.', { result });

    return result;
  }
}
