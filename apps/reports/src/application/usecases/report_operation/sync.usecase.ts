import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  ReportExportEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';
import {
  CreateReportOperationPspRequest,
  GenerateOperationReportFailedException,
  ReportGateway,
  SendReportPspRequest,
} from '@zro/reports/application';

export class SyncReportsOperationsUsecase {
  private fileCreated = false;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportOperationRepository Report operation repository.
   * @param reportGateway Report gateway export file.
   * @param reportOperationFileName File name to export.
   */
  constructor(
    private logger: Logger,
    private readonly reportOperationRepository: ReportOperationRepository,
    private readonly reportGateway: ReportGateway,
    private readonly reportOperationFileName: string,
  ) {
    this.logger = logger.child({ context: SyncReportsOperationsUsecase.name });
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports operations started.');

    const reportExport = new ReportExportEntity({
      id: uuidV4(),
      createdAt: new Date(),
      destFileName: this.reportOperationFileName,
    });

    this.logger.debug('Report export created.', { reportExport });

    for await (const reportOperation of this.reportOperationRepository.getAllGenerator()) {
      this.logger.debug('Adding report operation.', {
        reportOperationId: reportOperation.id,
      });

      try {
        const requestCreate: CreateReportOperationPspRequest = {
          reportExport,
          reportOperation,
        };

        await this.reportGateway.createReportOperation(requestCreate);
        this.fileCreated = true;
      } catch (error) {
        this.logger.debug('Error with add report operation to export.', {
          error,
        });

        throw new GenerateOperationReportFailedException(reportOperation);
      }
    }

    if (this.fileCreated) {
      const requestSend: SendReportPspRequest = { reportExport };

      await this.reportGateway.sendReport(requestSend);
    }

    reportExport.finishedAt = new Date();

    this.logger.debug('Report export operations finished.', { reportExport });
  }
}
