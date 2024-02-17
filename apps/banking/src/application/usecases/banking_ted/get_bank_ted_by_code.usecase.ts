import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { BankTed, BankTedRepository } from '@zro/banking/domain';

export class GetBankTedByCodeUseCase {
  constructor(
    private logger: Logger,
    private bankRepository: BankTedRepository,
  ) {
    this.logger = logger.child({
      context: GetBankTedByCodeUseCase.name,
    });
  }

  /**
   * Get bank by code.
   *
   * @param code BankTed code.
   * @returns The bank found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(code: string): Promise<BankTed> {
    if (!code) {
      throw new MissingDataException(['code']);
    }

    // Search bank
    const bank = await this.bankRepository.getByCode(code);

    this.logger.debug('BankTed found.', { bank });

    return bank;
  }
}
