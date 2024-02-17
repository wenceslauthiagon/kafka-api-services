import { Logger } from 'winston';

import { MissingDataException } from '@zro/common';
import { System, SystemRepository } from '@zro/otc/domain';
import { SystemNotFoundException } from '@zro/otc/application';

export class GetSystemByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param systemRepository System repository.
   */
  constructor(
    private logger: Logger,
    private readonly systemRepository: SystemRepository,
  ) {
    this.logger = logger.child({ context: GetSystemByIdUseCase.name });
  }

  /**
   * Get the System by id.
   *
   * @param {string} id System id.
   * @returns {System} System found.
   */
  async execute(id: string): Promise<System> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search system
    const result = await this.systemRepository.getById(id);

    this.logger.debug('Found system.', { result });

    if (!result) {
      throw new SystemNotFoundException({ id });
    }

    return result;
  }
}
