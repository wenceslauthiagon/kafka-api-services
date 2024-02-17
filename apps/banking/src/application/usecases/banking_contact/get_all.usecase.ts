import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  BankingContact,
  BankingContactRepository,
  TGetBankingContactFilter,
} from '@zro/banking/domain';

export class GetAllBankingContactUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bankingContactRepository BankingContact repository.
   */
  constructor(
    private logger: Logger,
    private readonly bankingContactRepository: BankingContactRepository,
  ) {
    this.logger = logger.child({ context: GetAllBankingContactUseCase.name });
  }

  /**
   * List all BankingContacts.
   *
   * @returns {BankingContact[]} BankingContacts found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    user: User,
    pagination: Pagination,
    filter: TGetBankingContactFilter,
  ): Promise<TPaginationResponse<BankingContact>> {
    // Data input check
    if (!user?.id || !pagination) {
      throw new MissingDataException([
        ...(!user?.id ? ['User ID'] : []),
        ...(!pagination ? ['Pagination'] : []),
      ]);
    }

    // Search contacts
    const bankingContacts =
      await this.bankingContactRepository.getByFilterAndUserAndPagination(
        user,
        pagination,
        filter,
      );

    this.logger.debug('Found banking contacts.', { bankingContacts });

    return bankingContacts;
  }
}
