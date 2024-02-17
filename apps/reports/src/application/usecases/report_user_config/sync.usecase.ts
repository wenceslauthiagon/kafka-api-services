import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  CreateReportUserConfigPspRequest,
  GenerateUserConfigReportFailedException,
  ReportGateway,
  SendReportPspRequest,
} from '@zro/reports/application';
import {
  ReportExportEntity,
  ReportUserConfigRepository,
} from '@zro/reports/domain';

export class SyncReportsUserConfigsUseCase {
  private fileCreated = false;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserConfigRepository Report User Config repository.
   * @param reportGateway Report gateway export file.
   * @param reportUserConfigsFileName File name to export.
   */
  constructor(
    private logger: Logger,
    private readonly reportUserConfigRepository: ReportUserConfigRepository,
    private readonly reportGateway: ReportGateway,
    private readonly reportUserConfigsFileName: string,
  ) {
    this.logger = logger.child({ context: SyncReportsUserConfigsUseCase.name });
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports user config started.');

    const reportExport = new ReportExportEntity({
      id: uuidV4(),
      createdAt: new Date(),
      destFileName: this.reportUserConfigsFileName,
    });

    this.logger.debug('Report export created.', { reportExport });

    for await (const reportUserConfig of this.reportUserConfigRepository.getAllGenerator()) {
      this.logger.debug('Adding report user config.', {
        reportUserConfigId: reportUserConfig.id,
      });

      try {
        const requestCreate: CreateReportUserConfigPspRequest = {
          reportExport,
          reportUserConfig,
        };

        await this.reportGateway.createReportUserConfig(requestCreate);
        this.fileCreated = true;
      } catch (error) {
        this.logger.debug('Error with add report user config to export.', {
          error,
        });

        throw new GenerateUserConfigReportFailedException(reportUserConfig);
      }
    }

    if (this.fileCreated) {
      const requestSend: SendReportPspRequest = {
        reportExport,
      };

      await this.reportGateway.sendReport(requestSend);
    }

    reportExport.finishedAt = new Date();

    this.logger.debug('Report export user configs finished.', { reportExport });
  }
}
