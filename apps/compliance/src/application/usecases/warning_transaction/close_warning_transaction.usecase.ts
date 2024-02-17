import { MissingDataException } from '@zro/common';
import { Logger } from 'winston';
import {
  WarningTransaction,
  WarningTransactionAnalysisResultType,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  WarningTransactionNotFoundException,
  WarningTransactionEventEmitter,
  WarningTransactionInvalidStatusException,
  PixPaymentService,
} from '@zro/compliance/application';
import { PixDepositEntity } from '@zro/pix-payments/domain';

/**
 * Close warning transaction.
 */
export class CloseWarningTransactionUseCase {
  /**
   * Default constructor.
   * @param {WarningTransactionRepository} warningTransactionRepository Warning transaction repository.
   * @param {WarningTransactionEventEmitter} warningTransactionEventEmitter Warning transaction event emitter.
   * @param {PixPaymentService} pixPaymentService Pix Payments Service.
   * @param {Logger} logger System logger.
   */
  constructor(
    private warningTransactionRepository: WarningTransactionRepository,
    private warningTransactionEventEmitter: WarningTransactionEventEmitter,
    private pixPaymentService: PixPaymentService,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: CloseWarningTransactionUseCase.name,
    });
  }

  /**
   * Close a warning transaction.
   * @param {WarningTransaction} warningTransaction Warning transaction params.
   * @returns {WarningTransaction} Warning transaction closed.
   */
  async execute(
    warningTransaction: WarningTransaction,
  ): Promise<WarningTransaction> {
    if (
      !warningTransaction?.operation?.id ||
      !warningTransaction?.analysisResult
    ) {
      throw new MissingDataException([
        ...(!warningTransaction?.operation?.id ? ['Operation ID'] : []),
        ...(!warningTransaction?.analysisResult ? ['Analysis Result'] : []),
      ]);
    }

    const { operation } = warningTransaction;

    // Check if warning transaction exists
    const foundWarningTransaction =
      await this.warningTransactionRepository.getByOperation(operation);

    this.logger.debug('Found warning transaction by operation id.', {
      warningTransaction: foundWarningTransaction,
    });

    // Sanity check.
    if (!foundWarningTransaction) {
      throw new WarningTransactionNotFoundException(warningTransaction);
    }

    // Indepotent.
    if (foundWarningTransaction.status === WarningTransactionStatus.CLOSED) {
      throw new WarningTransactionInvalidStatusException(
        foundWarningTransaction,
      );
    }

    foundWarningTransaction.analysisResult = warningTransaction.analysisResult;
    foundWarningTransaction.analysisDetails =
      warningTransaction?.analysisDetails;

    switch (foundWarningTransaction.analysisResult) {
      case WarningTransactionAnalysisResultType.APPROVED:
        return this.closeApproved(foundWarningTransaction);

      case WarningTransactionAnalysisResultType.REJECTED:
        return this.closeRejected(foundWarningTransaction);
    }
  }

  private async closeApproved(warningTransaction: WarningTransaction) {
    warningTransaction.status = WarningTransactionStatus.CLOSED;

    await this.warningTransactionRepository.update(warningTransaction);

    const data = new PixDepositEntity({
      operation: warningTransaction.operation,
    });

    await this.pixPaymentService.blockPixDeposit(data);

    this.warningTransactionEventEmitter.closedWarningTransaction(
      warningTransaction,
    );

    return warningTransaction;
  }

  private async closeRejected(warningTransaction: WarningTransaction) {
    warningTransaction.status = WarningTransactionStatus.CLOSED;

    await this.warningTransactionRepository.update(warningTransaction);

    const data = new PixDepositEntity({
      operation: warningTransaction.operation,
    });

    await this.pixPaymentService.approvePixDeposit(data);

    this.warningTransactionEventEmitter.closedWarningTransaction(
      warningTransaction,
    );

    return warningTransaction;
  }
}
