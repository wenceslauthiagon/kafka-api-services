import { Logger } from 'winston';
import {
  ReportGateway,
  SyncReportsUsersUseCase as UseCase,
} from '@zro/reports/application';
import { ReportUserRepository } from '@zro/reports/domain';

export class SyncReportsUsersController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserRepository Report User repository.
   * @param reportGateway Report gateway export file.
   */
  constructor(
    private logger: Logger,
    reportUserRepository: ReportUserRepository,
    reportGateway: ReportGateway,
    reportUserFileName: string,
  ) {
    this.logger.child({ context: SyncReportsUsersController.name });

    this.usecase = new UseCase(
      logger,
      reportUserRepository,
      reportGateway,
      reportUserFileName,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports users.');

    await this.usecase.execute();
  }
}
