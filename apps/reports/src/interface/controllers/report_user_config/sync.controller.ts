import { Logger } from 'winston';
import {
  ReportGateway,
  SyncReportsUserConfigsUseCase as UseCase,
} from '@zro/reports/application';
import { ReportUserConfigRepository } from '@zro/reports/domain';

export class SyncReportsUserConfigsController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserConfigRepository Report User Config repository.
   * @param reportGateway Report gateway export file.
   */
  constructor(
    private logger: Logger,
    reportUserConfigRepository: ReportUserConfigRepository,
    reportGateway: ReportGateway,
    reportUserFileName: string,
  ) {
    this.logger.child({ context: SyncReportsUserConfigsController.name });

    this.usecase = new UseCase(
      logger,
      reportUserConfigRepository,
      reportGateway,
      reportUserFileName,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports user configs.');

    await this.usecase.execute();
  }
}
