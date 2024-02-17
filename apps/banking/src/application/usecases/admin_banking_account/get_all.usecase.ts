import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import {
  AdminBankingAccount,
  AdminBankingAccountRepository,
  TGetAdminBankingAccountFilter,
} from '@zro/banking/domain';

export class GetAllAdminBankingAccountUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository AdminBankingAccount repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: AdminBankingAccountRepository,
  ) {
    this.logger = logger.child({
      context: GetAllAdminBankingAccountUseCase.name,
    });
  }

  /**
   * List all AdminBankingAccounts.
   *
   * @returns {AdminBankingAccount[]} AdminBankingAccounts found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    filter: TGetAdminBankingAccountFilter,
  ): Promise<TPaginationResponse<AdminBankingAccount>> {
    // Data input check
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search admin banking accounts
    const adminBankingAccounts = await this.repository.getByFilterAndPagination(
      filter,
      pagination,
    );

    this.logger.debug('Found admin banking accounts.', {
      adminBankingAccounts,
    });

    return adminBankingAccounts;
  }
}
