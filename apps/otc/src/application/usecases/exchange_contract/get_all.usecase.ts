import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
  getMoment,
} from '@zro/common';
import {
  GetExchangeContractFilter,
  ExchangeContract,
  ExchangeContractRepository,
} from '@zro/otc/domain';

export class GetAllExchangeContractUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param exchangeContractRepository ExchangeContract repository.
   */
  constructor(
    private logger: Logger,
    private readonly exchangeContractRepository: ExchangeContractRepository,
  ) {
    this.logger = logger.child({ context: GetAllExchangeContractUseCase.name });
  }

  /**
   * List all ExchangeContracts.
   * @param {Pagination} pagination pagitation params.
   * @param {GetExchangeContractFilter} filter filter params.
   * @param {String} search? optional search param.
   * @returns {ExchangeContract[]} ExchangeContracts found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    filter: GetExchangeContractFilter,
    search?: string,
  ): Promise<TPaginationResponse<ExchangeContract>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Threating date
    const threatedCreatedAt = {
      ...(filter?.createdAt?.start && {
        start: getMoment(filter.createdAt.start).startOf('day').toDate(),
      }),
      ...(filter?.createdAt?.end && {
        end: getMoment(filter.createdAt.end).startOf('day').toDate(),
      }),
    };

    // Search exchange contracts
    const result =
      await this.exchangeContractRepository.getAllByFilterAndPagination(
        pagination,
        { ...filter, createdAt: threatedCreatedAt },
        search,
      );

    this.logger.debug('Found exchange contracts.', { result });

    return result;
  }
}
