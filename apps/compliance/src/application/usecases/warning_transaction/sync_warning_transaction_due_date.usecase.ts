import { Logger } from 'winston';
import {
  WarningTransactionAnalysisResultType,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  WarningTransactionEventEmitter,
  PixPaymentService,
} from '@zro/compliance/application';
import { PixDepositEntity } from '@zro/pix-payments/domain';
import { getMoment } from '@zro/common';

export class SyncWarningTransactionDueDateUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository WarningTransaction repository.
   * @param eventEmitter WarningTransaction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: WarningTransactionRepository,
    private readonly eventEmitter: WarningTransactionEventEmitter,
    private readonly pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: SyncWarningTransactionDueDateUseCase.name,
    });
  }

  /**
   * Verify all WarningTransactions Due Date.
   */
  async execute(): Promise<void> {
    const warningTransactionsInAnalysis =
      await this.repository.getAllInAnalysis();

    for (const warningTransaction of warningTransactionsInAnalysis) {
      const { createdAt } = warningTransaction;

      const hasPassed72HoursAfterCreation =
        getMoment() > getMoment(createdAt).add(72, 'hours');

      if (hasPassed72HoursAfterCreation) {
        warningTransaction.status = WarningTransactionStatus.CLOSED;
        warningTransaction.analysisResult =
          WarningTransactionAnalysisResultType.EXPIRED;

        await this.repository.update(warningTransaction);

        const data = new PixDepositEntity({
          operation: warningTransaction.operation,
        });

        await this.pixPaymentService.approvePixDeposit(data);

        this.eventEmitter.expiredWarningTransaction(warningTransaction);
      }
    }

    this.logger.debug('WarningTransactions due date checked.', {
      warningTransactionsInAnalysis,
    });
  }
}
