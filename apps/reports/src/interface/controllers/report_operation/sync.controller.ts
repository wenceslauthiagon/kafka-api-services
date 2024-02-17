import { Logger } from 'winston';
import {
  ReportGateway,
  SyncReportsOperationsUsecase as UseCase,
} from '@zro/reports/application';
import { ReportOperationRepository } from '@zro/reports/domain';

export class SyncReportsOperationsController {
  private useCase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportOperationRepository Report operation repository.
   * @param reportGateway Report gateway export file.
   * @param reportOperationFileName Report operation file name.
   */
  constructor(
    private logger: Logger,
    reportOperationRepository: ReportOperationRepository,
    reportGateway: ReportGateway,
    reportOperationFileName: string,
  ) {
    this.logger.child({ context: SyncReportsOperationsController.name });

    this.useCase = new UseCase(
      logger,
      reportOperationRepository,
      reportGateway,
      reportOperationFileName,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports operations.');

    await this.useCase.execute();
  }
}
