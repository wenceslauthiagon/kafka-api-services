import { Logger } from 'winston';
import { isDefined, isString, isBoolean } from 'class-validator';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';

export class GetAllBankUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bankRepository Bank repository.
   */
  constructor(
    private logger: Logger,
    private readonly bankRepository: BankRepository,
  ) {
    this.logger = logger.child({ context: GetAllBankUseCase.name });
  }

  /**
   * List all banks with pagination.
   *
   * @param {Pagination} pagination The pagination.
   * @param {string} [search] The search term.
   * @param {string} [active] The active flag.
   * @returns {Bank[]} Banks found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    search?: string,
    active?: boolean,
  ): Promise<TPaginationResponse<Bank>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }
    if (isDefined(search) && !isString(search)) {
      throw new MissingDataException(['Search']);
    }
    if (isDefined(active) && !isBoolean(active)) {
      throw new MissingDataException(['Active']);
    }

    // Search banks
    const result = await this.bankRepository.getBySearchAndActive(
      pagination,
      search,
      active,
    );

    this.logger.debug('Found banks.', { result });

    return result;
  }
}
