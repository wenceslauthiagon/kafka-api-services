import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { BankingTed, BankingTedRepository } from '@zro/banking/domain';

export class GetBankingTedByIdUseCase {
  constructor(
    private logger: Logger,
    private bankingTedRepository: BankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetBankingTedByIdUseCase.name,
    });
  }

  /**
   * Get bankingTed by id.
   *
   * @param id BankingTed id.
   * @returns The bankingTed found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: number): Promise<BankingTed> {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search bankingTed
    const bankingTed = await this.bankingTedRepository.getById(id);

    this.logger.debug('BankingTed found.', { bankingTed });

    return bankingTed;
  }
}
