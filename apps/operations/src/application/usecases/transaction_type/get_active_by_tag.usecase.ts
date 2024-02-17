import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  TransactionType,
  TransactionTypeRepository,
} from '@zro/operations/domain';

export class GetActiveTransactionTypeByTagUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param transactionType Transaction type repository.
   */
  constructor(
    private logger: Logger,
    private readonly transactionTypeRepository: TransactionTypeRepository,
  ) {
    this.logger = logger.child({
      context: GetActiveTransactionTypeByTagUseCase.name,
    });
  }

  /**
   * Search active transaction type by tag.
   *
   * @param tag transaction type tag.
   * @returns Transaction type found or null otherwise.
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(tag: string): Promise<TransactionType> {
    // Data input check
    if (!tag) {
      throw new MissingDataException(['Tag']);
    }

    const transactionType =
      await this.transactionTypeRepository.getActiveByTag(tag);

    this.logger.debug('Transaction type found.', { transactionType });

    return transactionType;
  }
}
