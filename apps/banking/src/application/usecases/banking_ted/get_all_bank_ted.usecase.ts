import { Logger } from 'winston';
import { isDefined, isString, isBoolean } from 'class-validator';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import { BankTed, BankTedRepository } from '@zro/banking/domain';

export class GetAllBankTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bankTedRepository BankTed repository.
   */
  constructor(
    private logger: Logger,
    private readonly bankTedRepository: BankTedRepository,
  ) {
    this.logger = logger.child({ context: GetAllBankTedUseCase.name });
  }

  /**
   * List all banksTed with pagination.
   *
   * @param {Pagination} pagination The pagination.
   * @param {string} [search] The search term.
   * @param {string} [active] The active flag.
   * @returns {BankTed[]} BanksTed found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    search?: string,
    active?: boolean,
  ): Promise<TPaginationResponse<BankTed>> {
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

    // Search banksTed
    const result = await this.bankTedRepository.getBySearchAndActive(
      pagination,
      search,
      active,
    );

    this.logger.debug('Found banksTed.', { result });

    return result;
  }
}
