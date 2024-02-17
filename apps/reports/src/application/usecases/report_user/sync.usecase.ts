import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  CreateReportUserPspRequest,
  GenerateUserReportFailedException,
  ReportGateway,
  SendReportPspRequest,
} from '@zro/reports/application';
import { ReportExportEntity, ReportUserRepository } from '@zro/reports/domain';

export class SyncReportsUsersUseCase {
  private fileCreated = false;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserRepository Report User repository.
   * @param reportGateway Report gateway export file.
   * @param reportUserFileName File name to export.
   */
  constructor(
    private logger: Logger,
    private readonly reportUserRepository: ReportUserRepository,
    private readonly reportGateway: ReportGateway,
    private readonly reportUserFileName: string,
  ) {
    this.logger = logger.child({ context: SyncReportsUsersUseCase.name });
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports users started.');

    const reportExport = new ReportExportEntity({
      id: uuidV4(),
      createdAt: new Date(),
      destFileName: this.reportUserFileName,
    });

    this.logger.debug('Report export created.', { reportExport });

    for await (const reportUser of this.reportUserRepository.getAllGeneratorByFilter()) {
      this.logger.debug('Adding report user.', {
        reportUserId: reportUser.id,
        userId: reportUser.user.id,
      });

      try {
        const requestCreate: CreateReportUserPspRequest = {
          reportExport,
          reportUser,
        };

        await this.reportGateway.createReportUser(requestCreate);
        this.fileCreated = true;
      } catch (error) {
        this.logger.error('Error with add report user to export.', error);

        throw new GenerateUserReportFailedException(reportUser);
      }
    }

    if (this.fileCreated) {
      const requestSend: SendReportPspRequest = {
        reportExport,
      };

      await this.reportGateway.sendReport(requestSend);
    }

    reportExport.finishedAt = new Date();

    this.logger.debug('Report export users finished.', { reportExport });
  }
}
