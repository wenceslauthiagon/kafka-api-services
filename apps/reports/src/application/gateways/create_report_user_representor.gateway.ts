import { ReportExport } from '@zro/reports/domain';
import { UserLegalRepresentor } from '@zro/users/domain';

export interface CreateReportUserRepresentorPspRequest {
  userLegalRepresentor: UserLegalRepresentor;
  reportExport: ReportExport;
}

export interface CreateReportUserRepresentorGateway {
  createReportUserRepresentor(
    request: CreateReportUserRepresentorPspRequest,
  ): Promise<void>;
}
