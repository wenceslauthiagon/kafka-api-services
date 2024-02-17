import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  Remittance,
  RemittanceRepository,
  GetAllRemittanceFilter,
} from '@zro/otc/domain';

export class GetAllRemittanceUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param remittanceRepository  Remittance repository.
   */
  constructor(
    private logger: Logger,
    private readonly remittanceRepository: RemittanceRepository,
  ) {
    this.logger = logger.child({
      context: GetAllRemittanceUseCase.name,
    });
  }

  async execute(
    pagination: Pagination,
    filter?: GetAllRemittanceFilter,
  ): Promise<TPaginationResponse<Remittance>> {
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    const result = await this.remittanceRepository.getAllByFilter(
      pagination,
      filter,
    );

    this.logger.debug('Found remittances.', {
      remittance: result.total,
    });

    return result;
  }
}
