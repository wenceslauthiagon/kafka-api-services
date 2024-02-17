import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
} from '@zro/banking/domain';

export class GetAdminBankingTedByIdUseCase {
  constructor(
    private logger: Logger,
    private bankingTedRepository: AdminBankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetAdminBankingTedByIdUseCase.name,
    });
  }

  /**
   * Get bankingTed by id.
   *
   * @param id AdminBankingTed id.
   * @returns The bankingTed found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<AdminBankingTed> {
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search bankingTed
    const bankingTed = await this.bankingTedRepository.getById(id);

    this.logger.debug('AdminBankingTed found.', { bankingTed });

    return bankingTed;
  }
}
