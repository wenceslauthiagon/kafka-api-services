import { ReportOperation } from '@zro/reports/domain';

export interface ReportService {
  /**
   * Create report operation.
   * @param report ReportOperation.
   */
  createOperationReport(report: ReportOperation): Promise<void>;
}
