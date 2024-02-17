import { ReportExport, ReportOperation } from '@zro/reports/domain';

export interface CreateReportOperationPspRequest {
  reportOperation: ReportOperation;
  reportExport: ReportExport;
}

export interface CreateReportOperationGateway {
  createReportOperation(
    request: CreateReportOperationPspRequest,
  ): Promise<void>;
}
