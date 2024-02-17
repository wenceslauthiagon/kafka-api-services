import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  LimitType,
  LimitTypeFilter,
  LimitTypeRepository,
} from '@zro/operations/domain';

export class GetLimitTypesByFilterUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param limitTypeRepository Limit type repository.
   */
  constructor(
    private logger: Logger,
    private limitTypeRepository: LimitTypeRepository,
  ) {
    logger.child({ context: GetLimitTypesByFilterUseCase.name });
  }

  async execute(
    filter: LimitTypeFilter,
    pagination: Pagination,
  ): Promise<TPaginationResponse<LimitType>> {
    // Data input check
    if (!pagination || !filter) {
      throw new MissingDataException([
        ...(!pagination ? ['Pagination'] : []),
        ...(!filter ? ['Filter'] : []),
      ]);
    }

    const limitTypesFound = await this.limitTypeRepository.getByFilter(
      filter,
      pagination,
    );

    this.logger.debug('Limit types found.', { limitTypesFound });

    return limitTypesFound;
  }
}
