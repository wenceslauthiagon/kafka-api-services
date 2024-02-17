import { ReportExport, ReportUserConfig } from '@zro/reports/domain';

export interface CreateReportUserConfigPspRequest {
  reportUserConfig: ReportUserConfig;
  reportExport: ReportExport;
}

export interface CreateReportUserConfigGateway {
  createReportUserConfig(
    request: CreateReportUserConfigPspRequest,
  ): Promise<void>;
}
