import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  StreamPair,
  GetStreamPairFilter,
  StreamPairRepository,
} from '@zro/quotations/domain';

export class GetAllStreamPairUseCase {
  constructor(
    private logger: Logger,
    private readonly streamPairRepository: StreamPairRepository,
  ) {
    this.logger = logger.child({ context: GetAllStreamPairUseCase.name });
  }

  /**
   * Get stream pair.
   * @returns The StreamPair.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    filter: GetStreamPairFilter,
  ): Promise<TPaginationResponse<StreamPair>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    const streamPairs =
      await this.streamPairRepository.getAllByFilterAndPagination(
        pagination,
        filter,
      );

    this.logger.debug('Stream pairs found.', { streamPairs });

    return streamPairs;
  }
}
