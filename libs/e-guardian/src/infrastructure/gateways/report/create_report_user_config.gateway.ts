import * as path from 'path';
import { Logger } from 'winston';
import { appendFile } from 'fs/promises';
import {
  CreateReportUserConfigPspRequest,
  ReportGateway,
} from '@zro/reports/application';
import { ReportExport, ReportUserConfig } from '@zro/reports/domain';
import { CreateReportGatewayException } from '@zro/e-guardian/infrastructure';

interface IEguardianReportClientTypeFile {
  cd_tp_cliente: string;
  de_tp_cliente: string;
  tp_cliente: string;
}

export class EguardianCreateReportUserConfigGateway
  implements Pick<ReportGateway, 'createReportUserConfig'>
{
  constructor(private readonly logger: Logger) {
    this.logger = logger.child({
      context: EguardianCreateReportUserConfigGateway.name,
    });
  }

  async createReportUserConfig(
    request: CreateReportUserConfigPspRequest,
  ): Promise<void> {
    try {
      const report = this.formatReport(request.reportUserConfig);

      const content = Object.values(report).join('|').replace(/$/g, '\r');

      await appendFile(
        this.getDestination(request.reportExport),
        new Uint8Array(Buffer.from(content)),
      );
    } catch (error) {
      throw new CreateReportGatewayException(error);
    }
  }

  private formatReport(
    reportUserConfig: ReportUserConfig,
  ): IEguardianReportClientTypeFile {
    // Is necessary format de fields before send (like sanitize the length). Here we are just pick them.

    return {
      cd_tp_cliente: reportUserConfig.type,
      de_tp_cliente: reportUserConfig.description,
      tp_cliente: reportUserConfig.typeConfig,
    };
  }

  private getDestination(reportExport: ReportExport): string {
    return path.join(__dirname, `temp-${reportExport.id}.txt`);
  }
}
