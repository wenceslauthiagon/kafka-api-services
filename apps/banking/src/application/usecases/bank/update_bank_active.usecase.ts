import { Logger } from 'winston';
import { isBoolean } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';
import {
  BankNotFoundException,
  BankEventEmitter,
} from '@zro/banking/application';

export class UpdateBankUseCase {
  constructor(
    private logger: Logger,
    private readonly bankRepository: BankRepository,
    private readonly eventEmitter: BankEventEmitter,
  ) {
    this.logger = logger.child({ context: UpdateBankUseCase.name });
  }

  /**
   * Update bank.
   *
   * @param id Bank id.
   * @returns The updated bank.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string, active: boolean): Promise<Bank> {
    // Data input check
    if (!id || !isBoolean(active)) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!isBoolean(active) ? ['Active'] : []),
      ]);
    }

    const foundBank = await this.bankRepository.getById(id);

    this.logger.debug('Found bank.', { bank: foundBank });

    if (!foundBank) {
      throw new BankNotFoundException({ id });
    }

    foundBank.active = active;

    const updatedBank = await this.bankRepository.update(foundBank);

    // Fire UpdateBank event
    this.eventEmitter.updatedBank(updatedBank);

    this.logger.debug('Bank updated.', { bank: updatedBank });

    return updatedBank;
  }
}
