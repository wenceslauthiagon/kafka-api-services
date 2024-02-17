import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import {
  PixKeyHistory,
  GetPixKeyHistoryFilter,
  GetPixKeyFilter,
  PixKeyHistoryRepository,
} from '@zro/pix-keys/domain';

export class GetHistoryPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyHistoryRepository Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixKeyHistoryRepository: PixKeyHistoryRepository,
  ) {
    this.logger = logger.child({ context: GetHistoryPixKeyUseCase.name });
  }

  /**
   * Get the history pix key.
   *
   * @param {User} user Keys' owner.
   * @param {Pagination} pagination The pagination
   * @param {GetPixKeyHistoryFilter} filter Filter for query
   * @param {GetPixKeyFilter} filterPixKey Filter for query
   * @returns {TPaginationResponse<PixKeyHistory>} Pix history found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    filter: GetPixKeyHistoryFilter,
    filterPixKey: GetPixKeyFilter,
  ): Promise<TPaginationResponse<PixKeyHistory>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search pixKey
    const pixHistoryKey = await this.pixKeyHistoryRepository.getByFilter(
      pagination,
      filter,
      filterPixKey,
    );

    this.logger.debug('Found pix key.', { pixHistoryKey });

    return pixHistoryKey;
  }
}
