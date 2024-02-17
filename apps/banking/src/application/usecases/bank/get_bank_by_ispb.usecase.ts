import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';

export class GetBankByIspbUseCase {
  constructor(
    private logger: Logger,
    private bankRepository: BankRepository,
  ) {
    this.logger = logger.child({ context: GetBankByIspbUseCase.name });
  }

  /**
   * Get bank by ispb.
   *
   * @param ispb Bank ispb.
   * @returns The bank found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(ispb: string): Promise<Bank> {
    if (!ispb) {
      throw new MissingDataException(['ispb']);
    }

    // Search bank
    const bank = await this.bankRepository.getByIspb(ispb);

    this.logger.debug('Bank found.', { bank });

    return bank;
  }
}
