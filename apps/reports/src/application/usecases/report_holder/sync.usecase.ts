import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  ReportExportEntity,
  ReportUserRepository,
  TGetAllGeneratorFilter,
} from '@zro/reports/domain';
import { PersonType } from '@zro/users/domain';
import {
  CreateReportHolderPspRequest,
  GenerateHolderReportFailedException,
  ReportGateway,
  SendReportPspRequest,
} from '@zro/reports/application';

export class SyncReportsHoldersUseCase {
  private fileCreated = false;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param reportUserRepository Report User repository.
   * @param reportGateway Report gateway export file.
   * @param reportHolderFileName File name to export.
   */
  constructor(
    private logger: Logger,
    private readonly reportUserRepository: ReportUserRepository,
    private readonly reportGateway: ReportGateway,
    private readonly reportHolderFileName: string,
  ) {
    this.logger = logger.child({ context: SyncReportsHoldersUseCase.name });
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync reports holders started.');

    const reportExport = new ReportExportEntity({
      id: uuidV4(),
      createdAt: new Date(),
      destFileName: this.reportHolderFileName,
    });

    this.logger.debug('Report export created.', { reportExport });

    const filter: TGetAllGeneratorFilter = { type: PersonType.NATURAL_PERSON };

    for await (const reportUser of this.reportUserRepository.getAllGeneratorByFilter(
      filter,
    )) {
      this.logger.debug('Adding report holder.', {
        reportHolderId: reportUser.id,
        userId: reportUser.user.id,
      });

      try {
        const requestCreate: CreateReportHolderPspRequest = {
          reportExport,
          reportUser,
        };

        await this.reportGateway.createReportHolder(requestCreate);
        this.fileCreated = true;
      } catch (error) {
        this.logger.error('Error with add report holder to export.', error);

        throw new GenerateHolderReportFailedException(reportUser);
      }
    }

    if (this.fileCreated) {
      const requestSend: SendReportPspRequest = { reportExport };

      await this.reportGateway.sendReport(requestSend);
    }

    reportExport.finishedAt = new Date();

    this.logger.debug('Report export holders finished.', { reportExport });
  }
}
