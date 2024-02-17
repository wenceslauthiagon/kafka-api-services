import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Provider, ProviderRepository } from '@zro/otc/domain';
import { ProviderNotFoundException } from '@zro/otc/application';

export class GetByNameProviderUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param providerRepository Provider repository.
   */
  constructor(
    private logger: Logger,
    private readonly providerRepository: ProviderRepository,
  ) {
    this.logger = logger.child({ context: GetByNameProviderUseCase.name });
  }

  /**
   * Get the Provider by name.
   *
   * @param {string} name Provider name.
   * @returns {Provider} Provider found.
   */
  async execute(name: string): Promise<Provider> {
    // Data input check
    if (!name) {
      throw new MissingDataException(['Name']);
    }

    // Search provider
    const result = await this.providerRepository.getByName(name);

    this.logger.debug('Found provider.', { result });

    if (!result) {
      throw new ProviderNotFoundException({ name });
    }

    return result;
  }
}
