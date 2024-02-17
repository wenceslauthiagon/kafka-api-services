import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';

export class GetBankByIdUseCase {
  constructor(
    private logger: Logger,
    private bankRepository: BankRepository,
  ) {
    this.logger = logger.child({ context: GetBankByIdUseCase.name });
  }

  /**
   * Get bank by id.
   *
   * @param id Bank id.
   * @returns The bank found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<Bank> {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search bank
    const bank = await this.bankRepository.getById(id);

    this.logger.debug('Bank found.', { bank });

    return bank;
  }
}
