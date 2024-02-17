import { ReportExport, ReportUser } from '@zro/reports/domain';

export interface CreateReportHolderPspRequest {
  reportUser: ReportUser;
  reportExport: ReportExport;
}

export interface CreateReportHolderGateway {
  createReportHolder(request: CreateReportHolderPspRequest): Promise<void>;
}
