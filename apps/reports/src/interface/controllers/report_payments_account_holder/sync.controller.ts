import { Logger } from 'winston';
import {
  ReportGateway,
  SyncReportsPaymentsAccountHolderUseCase as UseCase,
} from '@zro/reports/application';
import { ReportUserRepository } from '@zro/reports/domain';

export class SyncReportsPaymentsAccountHolderController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserRepository Report User repository.
   * @param reportGateway Report gateway export file.
   * @param reportPaymentsAccountHolderFileName Report filename.
   */
  constructor(
    private logger: Logger,
    reportUserRepository: ReportUserRepository,
    reportGateway: ReportGateway,
    reportPaymentsAccountHolderFileName: string,
  ) {
    this.logger.child({
      context: SyncReportsPaymentsAccountHolderController.name,
    });

    this.usecase = new UseCase(
      logger,
      reportUserRepository,
      reportGateway,
      reportPaymentsAccountHolderFileName,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports payment account holder.');

    await this.usecase.execute();
  }
}
