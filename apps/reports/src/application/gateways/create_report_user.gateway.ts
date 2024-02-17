import { ReportExport, ReportUser } from '@zro/reports/domain';

export interface CreateReportUserPspRequest {
  reportUser: ReportUser;
  reportExport: ReportExport;
}

export interface CreateReportUserGateway {
  createReportUser(request: CreateReportUserPspRequest): Promise<void>;
}
