import { Logger } from 'winston';
import {
  TransactionRepository,
  TransactionStatement,
} from '@zro/payments-gateway/domain';
import { ReportService } from '@zro/payments-gateway/application';
import { ReportOperationEntity } from '@zro/reports/domain';
import {
  CurrencyEntity,
  OperationEntity,
  TransactionTypeEntity,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';

export class SyncTransactionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param transactionRepository Transaction repository.
   * @param reportService Report service.
   */
  constructor(
    private logger: Logger,
    private readonly transactionRepository: TransactionRepository,
    private readonly reportService: ReportService,
  ) {
    this.logger = logger.child({ context: SyncTransactionUseCase.name });
  }

  /**
   * Sync all pix transactions from Gateway.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(): Promise<void> {
    const failedTransactions = [];
    const transactionsToBeExecute = await this.transactionRepository.getAll();

    await Promise.allSettled(
      transactionsToBeExecute.map(async (transactionExecute) => {
        this.logger.debug(
          `Execute transactions for page ${transactionExecute.page}`,
          { length: transactionExecute.transactions.length },
        );

        await Promise.allSettled(
          transactionExecute.transactions.map(async (transaction) => {
            try {
              await this.handleReport(transaction);
            } catch (error) {
              failedTransactions.push(error);
            }
          }),
        );

        transactionExecute.ttl = 1;
        await this.transactionRepository.update(transactionExecute);
      }),
    );

    this.logger.error(`Finish process sync transactions`, {
      failedTransactions,
    });
  }

  /**
   * Send transaction for register in reports.
   * @param payload The gateway transaction
   */
  private async handleReport(payload: TransactionStatement): Promise<void> {
    const reportOperation = new ReportOperationEntity({
      operation: new OperationEntity({
        id: payload.operationId,
        createdAt: payload.operationDate,
        value: payload.operationValue,
      }),
      operationType: payload.operationType,
      transactionType: new TransactionTypeEntity({
        tag: payload.transactionTypeTag,
      }),
      thirdPart: new UserEntity({
        name: payload.thirdPartName,
        document: payload.thirdPartDocument,
        type: payload.thirdPartTypeDocument,
      }),
      client: new UserEntity({
        name: payload.clientName,
        document: payload.clientDocument,
        type: payload.clientTypeDocument,
      }),
      clientBankCode: payload.clientBankCode,
      clientBranch: payload.clientBranch,
      clientAccountNumber: payload.clientAccountNumber,
      currency: new CurrencyEntity({ symbol: payload.currencySymbol }),
    });

    await this.reportService.createReportOperation(reportOperation);

    this.logger.debug('Created report operation.', { reportOperation });
  }
}
