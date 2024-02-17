import * as path from 'path';
import { Logger } from 'winston';
import { rm } from 'fs/promises';
import { exec } from 'child_process';
import { SendReportPspRequest, ReportGateway } from '@zro/reports/application';
import { ReportExport } from '@zro/reports/domain';
import { SendReportGatewayException } from '@zro/e-guardian/infrastructure';

export interface EguardianSendReportRequest {
  reportExport: ReportExport;
}

export class EguardianSendReportGateway
  implements Pick<ReportGateway, 'sendReport'>
{
  constructor(
    private readonly logger: Logger,
    private readonly exportExternalDest: string,
  ) {
    this.logger = logger.child({
      context: EguardianSendReportGateway.name,
    });
  }

  async sendReport(request: SendReportPspRequest): Promise<void> {
    try {
      const destination = await this.getDestination(request.reportExport);

      await this.sendToExternal(destination, request.reportExport.destFileName);

      //Remove the file after send.
      await rm(destination);
    } catch (error) {
      throw new SendReportGatewayException(error);
    }
  }

  private getDestination(reportExport: ReportExport): string {
    return path.join(__dirname, `temp-${reportExport.id}.txt`);
  }

  private async sendToExternal(
    destination: string,
    fileName: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(
        `rsync ${destination} ${this.exportExternalDest}/${fileName}`,
        (error, _, stderr) => {
          if (error || stderr) {
            this.logger.debug(`Error when send report ${fileName}.`, {
              error: error.message || stderr,
            });

            //Remove the file if error to send.
            rm(destination);

            this.logger.debug('Tmp file removed successfully.');
            reject(error);
          }

          resolve();
        },
      );
    });
  }
}
