import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import { Provider, ProviderRepository } from '@zro/otc/domain';

export class GetAllProviderUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param providerRepository Provider repository.
   */
  constructor(
    private logger: Logger,
    private readonly providerRepository: ProviderRepository,
  ) {
    this.logger = logger.child({ context: GetAllProviderUseCase.name });
  }

  /**
   * List all Providers.
   *
   * @param {Pagination} pagination The pagination.
   * @returns {Provider[]} Providers found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
  ): Promise<TPaginationResponse<Provider>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search providers
    const result = await this.providerRepository.getAll(pagination);

    this.logger.debug('Found providers.', { result });

    return result;
  }
}
