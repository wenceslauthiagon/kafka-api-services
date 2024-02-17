import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  CreateReportPaymentsAccountHolderPspRequest,
  GeneratePaymentsAccountHolderReportFailedException,
  ReportGateway,
  SendReportPspRequest,
} from '@zro/reports/application';
import { ReportExportEntity, ReportUserRepository } from '@zro/reports/domain';
import { getMoment } from '@zro/common';

export class SyncReportsPaymentsAccountHolderUseCase {
  private fileCreated = false;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserRepository Report User repository.
   * @param reportGateway Report gateway export file.
   * @param reportPaymentsAccountHolderFileName File name to export.
   */
  constructor(
    private logger: Logger,
    private readonly reportUserRepository: ReportUserRepository,
    private readonly reportGateway: ReportGateway,
    private readonly reportPaymentsAccountHolderFileName: string,
  ) {
    this.logger = logger.child({
      context: SyncReportsPaymentsAccountHolderUseCase.name,
    });
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports payments account holder started.');

    const reportExport = new ReportExportEntity({
      id: uuidV4(),
      createdAt: getMoment().toDate(),
      destFileName: this.reportPaymentsAccountHolderFileName,
    });

    this.logger.debug('Report export created.', { reportExport });

    for await (const reportUser of this.reportUserRepository.getAllGeneratorByFilter()) {
      this.logger.debug('Adding report payments account holder.', {
        reportUserId: reportUser.id,
        userId: reportUser.user.id,
      });

      try {
        const requestCreate: CreateReportPaymentsAccountHolderPspRequest = {
          reportExport,
          reportUser,
        };

        await this.reportGateway.createReportPaymentsAccountHolder(
          requestCreate,
        );
        this.fileCreated = true;
      } catch (error) {
        this.logger.debug(
          'Error with add report payments account holder to export.',
          error,
        );

        throw new GeneratePaymentsAccountHolderReportFailedException(
          reportUser,
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

    this.logger.debug('Report export payments account holder finished.', {
      reportExport,
    });
  }
}
