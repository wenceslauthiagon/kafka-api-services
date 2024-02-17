import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { System, SystemRepository } from '@zro/otc/domain';

export class GetSystemByNameUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param systemRepository System repository.
   */
  constructor(
    private logger: Logger,
    private readonly systemRepository: SystemRepository,
  ) {
    this.logger = logger.child({ context: GetSystemByNameUseCase.name });
  }

  /**
   * Get the System by name.
   *
   * @param {string} name System.
   * @returns {System} System found.
   */
  async execute(name: string): Promise<System> {
    // Data input check
    if (!name) {
      throw new MissingDataException(['Name']);
    }

    // Search system
    const result = await this.systemRepository.getByName(name);

    this.logger.debug('Found system.', { result });

    return result;
  }
}
