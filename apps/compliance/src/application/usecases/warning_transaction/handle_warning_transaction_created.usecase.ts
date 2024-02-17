import { MissingDataException } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { Logger } from 'winston';
import {
  WarningTransactionNotFoundException,
  WarningTransactionGateway,
  WarningTransactionEventEmitter,
} from '@zro/compliance/application';
import {
  OperationNotFoundException,
  TransactionTypeTagNotFoundException,
} from '@zro/operations/application';
import {
  CreateWarningTransactionRequest,
  WarningTransactionInvalidStatusException,
} from '@zro/compliance/application';

/**
 * Handle warning transaction creation.
 */
export class HandleWarningTransactionCreatedUseCase {
  /**
   * Default constructor.
   * @param {WarningTransactionRepository} warningTransactionRepository Warning transaction repository.
   * @param {WarningTransactionEventEmitter} warningTransactionEventEmitter Warning transaction event emitter.
   * @param {WarningTransactionGateway} jiraWarningTransactionGateway Send warning transaction to jira.
   * @param {Logger} logger System logger.
   */
  constructor(
    private warningTransactionRepository: WarningTransactionRepository,
    private warningTransactionEventEmitter: WarningTransactionEventEmitter,
    private jiraWarningTransactionGateway: WarningTransactionGateway,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleWarningTransactionCreatedUseCase.name,
    });
  }

  /**
   * Handle created warning transaction.
   * @param {String} id Warning transaction ID.
   * @returns {WarningTransaction}
   */
  async execute(id: string): Promise<WarningTransaction> {
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

    // Operation is needed to send it to jira
    if (!warningTransaction.operation)
      throw new OperationNotFoundException(warningTransaction.operation?.id);

    // Transaction tag is needed to send it to jira
    if (!warningTransaction.transactionTag)
      throw new TransactionTypeTagNotFoundException(
        warningTransaction.transactionTag,
      );

    // Check indepotency
    if (warningTransaction.status === WarningTransactionStatus.SENT) {
      return warningTransaction;
    }

    // Check if warning transaction status is final.
    if (warningTransaction.isClosed() || warningTransaction.isFailed()) {
      throw new WarningTransactionInvalidStatusException(warningTransaction);
    }

    const request: CreateWarningTransactionRequest = {
      operation: warningTransaction.operation,
      transactionTag: warningTransaction.transactionTag,
      ...(warningTransaction.endToEndId && {
        endToEndId: warningTransaction.endToEndId,
      }),
      ...(warningTransaction.reason && {
        reason: warningTransaction.reason,
      }),
    };

    // Send warning transaction
    const { issueId } =
      await this.jiraWarningTransactionGateway.createWarningTransaction(
        request,
      );

    warningTransaction.issueId = issueId;
    warningTransaction.status = WarningTransactionStatus.SENT;
    await this.warningTransactionRepository.update(warningTransaction);

    // Fire warning transaction sent event
    this.warningTransactionEventEmitter.sentWarningTransaction(
      warningTransaction,
    );

    return warningTransaction;
  }
}
