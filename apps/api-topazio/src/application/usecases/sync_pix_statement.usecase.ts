import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { FailedEntity, TranslateService } from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PaymentEntity,
  PixDepositEntity,
  PixDevolutionReceivedEntity,
} from '@zro/pix-payments/domain';
import {
  FailedNotifyCredit,
  FailedNotifyCreditEntity,
  FailedNotifyCreditRepository,
  PaymentStatusType,
  PixStatementRepository,
  TransactionType,
} from '@zro/api-topazio/domain';
import {
  PixPaymentService,
  GetStatementPixStatementResponse,
} from '@zro/api-topazio/application';

export class SyncPixStatementUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixPaymentService Payment service.
   * @param pixStatementRepository PixStatement repository.
   * @param failedNotifyCreditRepository Failed notify credit repository.
   */
  constructor(
    private logger: Logger,
    private readonly pixPaymentService: PixPaymentService,
    private readonly pixStatementRepository: PixStatementRepository,
    private readonly failedNotifyCreditRepository: FailedNotifyCreditRepository,
    private readonly zroBankIspb: string,
    private readonly translateService: TranslateService,
  ) {
    this.logger = logger.child({ context: SyncPixStatementUseCase.name });
  }

  /**
   * Sync all pix statements from PSP.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(): Promise<void> {
    const statementsToBeExecute = await this.pixStatementRepository.getAll();
    const failedStatements: FailedNotifyCredit[] = [];

    await Promise.allSettled(
      statementsToBeExecute.map(async (statementExecute) => {
        this.logger.debug(
          `Execute statements for page ${statementExecute.page}`,
          { length: statementExecute.statements.length },
        );

        await Promise.allSettled(
          statementExecute.statements.map(async (statement) => {
            if (
              statement.clientBankIspb === this.zroBankIspb &&
              statement.status === PaymentStatusType.SETTLED &&
              statement.transactionType === TransactionType.CREDIT
            ) {
              try {
                await this.handleCreditStatement(statement);
              } catch (error) {
                const message = await this.translateService.translate(
                  'default_exceptions',
                  error.code,
                );

                // Save failed transaction ID and captured error
                const newFailedNotifyCredit = new FailedNotifyCreditEntity({
                  id: uuidV4(),
                  transactionId: statement.transactionId,
                  failed: new FailedEntity({
                    code: error.code,
                    message,
                  }),
                });

                failedStatements.push(newFailedNotifyCredit);
              }
            }
          }),
        );

        statementExecute.ttl = 1;
        await this.pixStatementRepository.update(statementExecute);
      }),
    );

    // Save failed transactions into FailedNotifyCredit repository.
    for (const failedStatement of failedStatements) {
      await this.failedNotifyCreditRepository.create(failedStatement);

      this.logger.debug('Created new failed notify credit.', {
        failedStatement,
      });
    }

    this.logger.error('Finish process sync statements', { failedStatements });
  }

  private handleCreditStatement(
    payload: GetStatementPixStatementResponse,
  ): Promise<void> {
    this.logger.debug('Notify credit received.', { payload });

    const { isDevolution } = payload;

    if (isDevolution) {
      return this.handleDevolution(payload);
    }

    return this.handleDeposit(payload);
  }

  /**
   * Credit is not a devolution. Send receivedDeposit because is a deposit.
   * @param payload The notify credit payload
   */
  private async handleDeposit(
    payload: GetStatementPixStatementResponse,
  ): Promise<void> {
    const deposit = new PixDepositEntity({
      id: payload.transactionId,
      txId: payload.txId,
      endToEndId: payload.endToEndId,
      amount: payload.amount,
      clientBank: new BankEntity({ ispb: payload.clientBankIspb }),
      clientBranch: payload.clientBranch,
      clientAccountNumber: payload.clientAccountNumber,
      clientDocument: payload.clientDocument,
      clientName: payload.clientName,
      clientKey: payload.clientKey,
      thirdPartBank: new BankEntity({ ispb: payload.thirdPartBankIspb }),
      thirdPartBranch: payload.thirdPartBranch,
      thirdPartAccountType: payload.thirdPartAccountType,
      thirdPartAccountNumber: payload.thirdPartAccountNumber,
      thirdPartDocument: payload.thirdPartDocument,
      thirdPartName: payload.thirdPartName,
      thirdPartKey: payload.thirdPartKey,
      description: payload.description,
    });

    const result = await this.pixPaymentService.receivePixDeposit(deposit);

    this.logger.debug('Received deposit created.', { deposit: result });
  }

  /**
   * Credit is a devolution. Send receivedDevolution because is a external devolution.
   * @param payload The notify credit payload
   */
  private async handleDevolution(
    payload: GetStatementPixStatementResponse,
  ): Promise<void> {
    const devolutionReceived = new PixDevolutionReceivedEntity({
      id: payload.transactionId,
      txId: payload.txId,
      endToEndId: payload.endToEndId,
      amount: payload.amount,
      payment: new PaymentEntity({ id: payload.transactionOriginalId }),
      clientBank: new BankEntity({ ispb: payload.clientBankIspb }),
      clientBranch: payload.clientBranch,
      clientAccountNumber: payload.clientAccountNumber,
      clientDocument: payload.clientDocument,
      clientName: payload.clientName,
      clientKey: payload.clientKey,
      thirdPartBank: new BankEntity({ ispb: payload.thirdPartBankIspb }),
      thirdPartBranch: payload.thirdPartBranch,
      thirdPartAccountType: payload.thirdPartAccountType,
      thirdPartAccountNumber: payload.thirdPartAccountNumber,
      thirdPartDocument: payload.thirdPartDocument,
      thirdPartName: payload.thirdPartName,
      thirdPartKey: payload.thirdPartKey,
      description: payload.description,
    });

    const result =
      await this.pixPaymentService.receivePixDevolution(devolutionReceived);

    this.logger.debug('Received devolution created.', {
      devolutionReceived: result,
    });
  }
}
