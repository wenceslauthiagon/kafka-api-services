import { ReportExport, ReportUser } from '@zro/reports/domain';

export interface CreateReportPaymentsAccountHolderPspRequest {
  reportUser: ReportUser;
  reportExport: ReportExport;
}

export interface CreateReportPaymentsAccountHolderGateway {
  createReportPaymentsAccountHolder(
    request: CreateReportPaymentsAccountHolderPspRequest,
  ): Promise<void>;
}
