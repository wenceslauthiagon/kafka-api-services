import { Logger } from 'winston';
import {
  ReportGateway,
  SyncReportsHoldersUseCase as UseCase,
} from '@zro/reports/application';
import { ReportUserRepository } from '@zro/reports/domain';

export class SyncReportsHoldersController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserRepository Report User repository.
   * @param reportGateway Report gateway export file.
   * @param reportHolderFileName Report holder file name.
   */
  constructor(
    private logger: Logger,
    reportUserRepository: ReportUserRepository,
    reportGateway: ReportGateway,
    reportHolderFileName: string,
  ) {
    this.logger.child({ context: SyncReportsHoldersController.name });

    this.usecase = new UseCase(
      logger,
      reportUserRepository,
      reportGateway,
      reportHolderFileName,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports holders.');

    await this.usecase.execute();
  }
}
