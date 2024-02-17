import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
  TGetAdminBankingTedFilter,
} from '@zro/banking/domain';

export class GetAllAdminBankingTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository AdminBankingTed repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: AdminBankingTedRepository,
  ) {
    this.logger = logger.child({ context: GetAllAdminBankingTedUseCase.name });
  }

  /**
   * List all AdminBankingTeds.
   *
   * @returns AdminBankingTeds found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    filter: TGetAdminBankingTedFilter,
  ): Promise<TPaginationResponse<AdminBankingTed>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search admin banking teds
    const adminBankingTeds = await this.repository.getByFilterAndPagination(
      filter,
      pagination,
    );

    this.logger.debug('Admin banking teds found.', { adminBankingTeds });

    return adminBankingTeds;
  }
}
