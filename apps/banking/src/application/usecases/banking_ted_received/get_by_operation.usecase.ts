import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  BankingTedReceived,
  BankingTedReceivedRepository,
} from '@zro/banking/domain';
import { Operation } from '@zro/operations/domain';

export class GetBankingTedReceivedByOperationUseCase {
  constructor(
    private logger: Logger,
    private bankingTedReceivedRepository: BankingTedReceivedRepository,
  ) {
    this.logger = logger.child({
      context: GetBankingTedReceivedByOperationUseCase.name,
    });
  }

  /**
   * Get BankingTedReceived by Operation.
   *
   * @param operation Operation.
   * @returns The BankingTedReceived found or null otherwise.
   */
  async execute(operation: Operation): Promise<BankingTedReceived> {
    if (!operation?.id) {
      throw new MissingDataException(['Operation ID']);
    }

    // Search bankingTedReceived
    const bankingTedReceived =
      await this.bankingTedReceivedRepository.getByOperation(operation);

    this.logger.debug('BankingTedReceived found.', { bankingTedReceived });

    return bankingTedReceived;
  }
}
