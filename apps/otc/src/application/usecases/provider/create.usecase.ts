import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Provider, ProviderEntity, ProviderRepository } from '@zro/otc/domain';

export class CreateProviderUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param providerRepository Provider repository.
   */
  constructor(
    private logger: Logger,
    private readonly providerRepository: ProviderRepository,
  ) {
    this.logger = logger.child({ context: CreateProviderUseCase.name });
  }

  /**
   * Get the Provider by name.
   *
   * @param {string} id Provider id.
   * @param {string} name Provider name.
   * @param {string} description Provider description.
   * @returns {Provider} Provider created.
   */
  async execute(
    id: string,
    name: string,
    description?: string,
  ): Promise<Provider> {
    // Data input check
    if (!id || !name) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!name ? ['Name'] : []),
      ]);
    }

    // Check if Provider's id is available
    const checkProviderId = await this.providerRepository.getById(id);

    this.logger.debug('Check if provider id exists.', {
      provider: checkProviderId,
    });

    if (checkProviderId) {
      return checkProviderId;
    }

    // Check if Provider's name is available
    const checkProviderName = await this.providerRepository.getByName(name);

    this.logger.debug('Check if provider name exists.', {
      provider: checkProviderName,
    });

    if (checkProviderName) {
      return checkProviderName;
    }

    const provider = new ProviderEntity({ id, name, description });

    // create provider
    const result = await this.providerRepository.create(provider);

    this.logger.debug('Added provider.', { result });

    return result;
  }
}
