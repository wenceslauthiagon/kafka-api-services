import { Logger } from 'winston';
import {
  ReportGateway,
  SyncReportsUserLegalRepresentorUseCase as UseCase,
} from '@zro/reports/application';
import { ReportUserLegalRepresentorRepository } from '@zro/reports/domain';

export class SyncReportsUserLegalRepresentorController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserLegalRepresentorRepository Report User Legal Representor repository.
   * @param reportGateway Report gateway export file.
   */
  constructor(
    private logger: Logger,
    reportUserLegalRepresentorRepository: ReportUserLegalRepresentorRepository,
    reportGateway: ReportGateway,
    reportUserLegalRepresentorFileName: string,
  ) {
    this.logger.child({
      context: SyncReportsUserLegalRepresentorController.name,
    });

    this.usecase = new UseCase(
      logger,
      reportUserLegalRepresentorRepository,
      reportGateway,
      reportUserLegalRepresentorFileName,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports user legal representor.');

    await this.usecase.execute();
  }
}
