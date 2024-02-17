import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  BankingTed,
  BankingTedRepository,
  TGetBankingTedFilter,
} from '@zro/banking/domain';

export class GetAllBankingTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bankingRepository BankingTed repository.
   * @param bankIspb Bank ispb.
   */
  constructor(
    private logger: Logger,
    private readonly bankingRepository: BankingTedRepository,
  ) {
    this.logger = logger.child({ context: GetAllBankingTedUseCase.name });
  }

  /**
   * List all BankingTeds.
   *
   * @returns {BankingTed[]} BankingTeds found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    user: User,
    filter: TGetBankingTedFilter,
  ): Promise<TPaginationResponse<BankingTed>> {
    // Data input check
    // Data input check
    if (!user?.uuid || !pagination) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!pagination ? ['Pagination'] : []),
      ]);
    }

    // Search bankings
    const bankingTeds =
      await this.bankingRepository.getByFilterAndUserAndPagination(
        filter,
        user,
        pagination,
      );

    this.logger.debug('Found banking teds.', { bankingTeds });

    return bankingTeds;
  }
}
