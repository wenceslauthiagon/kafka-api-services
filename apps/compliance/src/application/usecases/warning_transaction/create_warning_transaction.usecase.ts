import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  WarningTransaction,
  WarningTransactionEntity,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { MissingDataException } from '@zro/common';
import {
  WarningTransactionAlreadyExistsException,
  WarningTransactionEventEmitter,
} from '@zro/compliance/application';

/**
 * Create warning transaction.
 */
export class CreateWarningTransactionUseCase {
  /**
   * Default constructor.
   * @param {Logger} logger Global logger instance.
   * @param {WarningTransactionRepository} warningTransactionRepository Warning transaction repository.
   * @param {WarningTransactionEventEmitter} warningTransactionEventEmitter Warning transaction event emitter.
   */

  constructor(
    private logger: Logger,
    private warningTransactionRepository: WarningTransactionRepository,
    private warningTransactionEventEmitter: WarningTransactionEventEmitter,
  ) {
    this.logger = logger.child({
      context: CreateWarningTransactionUseCase.name,
    });
  }

  /**
   * Create a warning transaction.
   * @param {WarningTransaction} warningTransaction Warning transaction params.
   * @returns {WarningTransaction} Warning transaction created.
   */
  async execute(
    warningTransaction: WarningTransaction,
  ): Promise<WarningTransaction> {
    if (!warningTransaction?.operation || !warningTransaction?.transactionTag) {
      throw new MissingDataException([
        ...(!warningTransaction?.operation
          ? ['Warning Transaction Operation']
          : []),
        ...(!warningTransaction?.transactionTag
          ? [' Warning Transaction tag']
          : []),
      ]);
    }

    const { operation } = warningTransaction;

    //check if warning transaction already exists
    const existentWarningTransaction =
      await this.warningTransactionRepository.getByOperation(operation);

    this.logger.debug('Found warning transaction by operation id.', {
      warningTransaction: existentWarningTransaction,
    });

    if (existentWarningTransaction)
      throw new WarningTransactionAlreadyExistsException(
        existentWarningTransaction,
      );

    const newWarningTransaction = new WarningTransactionEntity({
      id: uuidV4(),
      operation: warningTransaction.operation,
      transactionTag: warningTransaction.transactionTag,
      status: WarningTransactionStatus.PENDING,
      ...(warningTransaction.endToEndId && {
        endToEndId: warningTransaction.endToEndId,
      }),
      ...(warningTransaction.reason && {
        reason: warningTransaction.reason,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.warningTransactionRepository.create(newWarningTransaction);

    this.logger.debug('Warning transaction created.', {
      warningTransaction: newWarningTransaction,
    });

    this.warningTransactionEventEmitter.pendingWarningTransaction(
      newWarningTransaction,
    );

    return newWarningTransaction;
  }
}
