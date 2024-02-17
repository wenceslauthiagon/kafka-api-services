import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Provider, ProviderRepository } from '@zro/otc/domain';
import { ProviderNotFoundException } from '@zro/otc/application';

export class GetByIdProviderUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param providerRepository Provider repository.
   */
  constructor(
    private logger: Logger,
    private readonly providerRepository: ProviderRepository,
  ) {
    this.logger = logger.child({ context: GetByIdProviderUseCase.name });
  }

  /**
   * Get the Provider by id.
   *
   * @param {string} id Provider id.
   * @returns {Provider} Provider found.
   */
  async execute(id: string): Promise<Provider> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search provider
    const result = await this.providerRepository.getById(id);

    this.logger.debug('Found provider.', { result });

    if (!result) {
      throw new ProviderNotFoundException({ id });
    }

    return result;
  }
}
