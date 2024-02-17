import { ReportOperation } from '@zro/reports/domain';

export interface ReportService {
  /**
   * Create report operation with gateway transactions.
   * @param reportOperation Report operation.
   */
  createReportOperation(reportOperation: ReportOperation): Promise<void>;
}
