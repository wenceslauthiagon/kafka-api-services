import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { BankingTed, BankingTedRepository } from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';

export class GetBankingTedByOperationUseCase {
  constructor(
    private logger: Logger,
    private bankingTedRepository: BankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetBankingTedByOperationUseCase.name,
    });
  }

  /**
   * Get BankingTed by Operation.
   *
   * @param operation Operation.
   * @returns The BankingTed found or null otherwise.
   */
  async execute(operation: Operation): Promise<BankingTed> {
    if (!operation?.id) {
      throw new MissingDataException(['Operation ID']);
    }

    // Search bankingTed
    const bankingTed =
      await this.bankingTedRepository.getByOperation(operation);

    this.logger.debug('BankingTed found.', { bankingTed });

    return bankingTed;
  }
}
