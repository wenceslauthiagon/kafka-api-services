import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
} from '@zro/banking/domain';

export class GetAdminBankingTedByTransactionIdUseCase {
  constructor(
    private logger: Logger,
    private adminBankingTedRepository: AdminBankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetAdminBankingTedByTransactionIdUseCase.name,
    });
  }

  /**
   * Get adminBankingTed by transactionId.
   *
   * @param transactionId AdminBankingTed transactionId.
   * @returns The adminBankingTed found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(transactionId: string): Promise<AdminBankingTed> {
    if (!transactionId) {
      throw new MissingDataException(['Transaction ID']);
    }

    // Search adminBankingTed
    const adminBankingTed =
      await this.adminBankingTedRepository.getByTransactionId(transactionId);

    this.logger.debug('AdminBankingTed found.', { adminBankingTed });

    return adminBankingTed;
  }
}
