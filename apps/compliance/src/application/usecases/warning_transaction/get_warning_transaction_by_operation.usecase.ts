import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionRepository,
} from '@zro/compliance/domain';
import { Operation } from '@zro/operations/domain';

/**
 * Get warning transaction by operation.
 */
export class GetWarningTransactionByOperationUseCase {
  /**
   * Default constructor.
   * @param {Logger} logger Global logger instance.
   * @param {WarningTransactionRepository} warningTransactionRepository Warning transaction repository.
   */

  constructor(
    private logger: Logger,
    private warningTransactionRepository: WarningTransactionRepository,
  ) {
    this.logger = logger.child({
      context: GetWarningTransactionByOperationUseCase.name,
    });
  }

  /**
   * Get a warning transaction by operation.
   * @param operation operation params.
   * @returns Warning transaction.
   */
  async execute(operation: Operation): Promise<WarningTransaction> {
    // Data input check
    if (!operation?.id) {
      throw new MissingDataException(['Operation ID']);
    }

    //check if warning transaction already exists
    const warningTransaction =
      await this.warningTransactionRepository.getByOperation(operation);

    this.logger.debug('Warning transaction found.', {
      warningTransaction,
    });

    return warningTransaction;
  }
}
