import { MissingDataException } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { Logger } from 'winston';
import {
  WarningTransactionNotFoundException,
  WarningTransactionEventEmitter,
} from '@zro/compliance/application';

/**
 * Handle warning transaction dead letter.
 */
export class HandleWarningTransactionDeadLetterUseCase {
  /**
   * Default constructor.
   * @param {WarningTransactionRepository} warningTransactionRepository Warning transaction repository.
   * @param {WarningTransactionEventEmitter} warningTransactionEventEmitter Warning transaction event emitter.
   * @param {Logger} logger System logger.
   */
  constructor(
    private warningTransactionRepository: WarningTransactionRepository,
    private warningTransactionEventEmitter: WarningTransactionEventEmitter,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleWarningTransactionDeadLetterUseCase.name,
    });
  }

  /**
   * Handle dead letter warning transaction.
   * @param {String} id Warning transaction ID.
   * @returns {WarningTransaction}
   */
  async execute(id: string): Promise<WarningTransaction> {
    this.logger.debug('Failing warning transaction', {
      id,
    });

    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get warning transaction data.
    const warningTransaction =
      await this.warningTransactionRepository.getById(id);

    // Sanity check.
    if (!warningTransaction) {
      throw new WarningTransactionNotFoundException({ id });
    }

    // Check if warning transaction status is final.
    if (warningTransaction.isClosed() || warningTransaction.isFailed()) {
      this.logger.debug('Warning transaction is already sent or failed', {
        warningTransaction,
      });
      return warningTransaction;
    }

    // Set warning transaction was failed.
    warningTransaction.status = WarningTransactionStatus.FAILED;

    // Update warning transaction
    await this.warningTransactionRepository.update(warningTransaction);

    // Fire warning transaction sent event.
    this.warningTransactionEventEmitter.failedWarningTransaction(
      warningTransaction,
    );

    return warningTransaction;
  }
}
