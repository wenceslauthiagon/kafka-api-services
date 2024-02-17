import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  CreateReportUserRepresentorPspRequest,
  GenerateUserLegalRepresentorReportFailedException,
  ReportGateway,
  SendReportPspRequest,
} from '@zro/reports/application';
import {
  ReportExportEntity,
  ReportUserLegalRepresentorRepository,
} from '@zro/reports/domain';
import { getMoment } from '@zro/common';

export class SyncReportsUserLegalRepresentorUseCase {
  private fileCreated = false;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserLegalRepresentorRepository Report User legal representor repository.
   * @param reportGateway Report gateway export file.
   * @param reportUserLegalRepresentorFileName File name to export.
   */
  constructor(
    private logger: Logger,
    private readonly reportUserLegalRepresentorRepository: ReportUserLegalRepresentorRepository,
    private readonly reportGateway: ReportGateway,
    private readonly reportUserLegalRepresentorFileName: string,
  ) {
    this.logger = logger.child({
      context: SyncReportsUserLegalRepresentorUseCase.name,
    });
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports user legal representor started.');

    const reportExport = new ReportExportEntity({
      id: uuidV4(),
      createdAt: getMoment().toDate(),
      destFileName: this.reportUserLegalRepresentorFileName,
    });

    this.logger.debug('Report export created.', { reportExport });

    for await (const reportUserLegalRepresentor of this.reportUserLegalRepresentorRepository.getAllGenerator()) {
      this.logger.debug('Adding report user legal representor.', {
        reportUserLegalRepresentorId: reportUserLegalRepresentor.id,
      });

      try {
        const requestCreate: CreateReportUserRepresentorPspRequest = {
          userLegalRepresentor: reportUserLegalRepresentor,
          reportExport,
        };

        await this.reportGateway.createReportUserRepresentor(requestCreate);
        this.fileCreated = true;
      } catch (error) {
        this.logger.debug(
          'Error with add report user legal representor to export.',
          error,
        );

        throw new GenerateUserLegalRepresentorReportFailedException(
          reportUserLegalRepresentor,
        );
      }
    }

    if (this.fileCreated) {
      const requestSend: SendReportPspRequest = {
        reportExport,
      };

      await this.reportGateway.sendReport(requestSend);
    }

    reportExport.finishedAt = getMoment().toDate();

    this.logger.debug('Report export user legal representor finished.', {
      reportExport,
    });
  }
}
