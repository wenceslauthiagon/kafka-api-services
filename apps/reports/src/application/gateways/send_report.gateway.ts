import { ReportExport } from '@zro/reports/domain';

export interface SendReportPspRequest {
  reportExport: ReportExport;
}

export interface SendReportGateway {
  sendReport(request: SendReportPspRequest): Promise<void>;
}
