import { Logger } from 'winston';
import {
  SyncTransactionUseCase as UseCase,
  ReportService,
} from '@zro/payments-gateway/application';
import { TransactionRepository } from '@zro/payments-gateway/domain';

export class SyncTransactionController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    transactionRepository: TransactionRepository,
    reportService: ReportService,
  ) {
    this.logger = logger.child({ context: SyncTransactionController.name });

    this.usecase = new UseCase(
      this.logger,
      transactionRepository,
      reportService,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync gateway transactions request.');

    await this.usecase.execute();

    this.logger.debug('Finish sync gateway transactions.');
  }
}
