import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { BankingTed, BankingTedRepository } from '@zro/banking/domain';

export class GetBankingTedByTransactionIdUseCase {
  constructor(
    private logger: Logger,
    private bankingTedRepository: BankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetBankingTedByTransactionIdUseCase.name,
    });
  }

  /**
   * Get bankingTed by transactionId.
   *
   * @param transactionId BankingTed transactionId.
   * @returns The bankingTed found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(transactionId: string): Promise<BankingTed> {
    if (!transactionId) {
      throw new MissingDataException(['Transaction ID']);
    }

    // Search bankingTed
    const bankingTed =
      await this.bankingTedRepository.getByTransactionId(transactionId);

    this.logger.debug('BankingTed found.', { bankingTed });

    return bankingTed;
  }
}
