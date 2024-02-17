import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { ReportOperation } from '@zro/reports/domain';

@Exception(ExceptionTypes.SYSTEM, 'GENERATE_OPERATION_REPORT_FAILED')
export class GenerateOperationReportFailedException extends DefaultException {
  constructor(data: Partial<ReportOperation>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'GENERATE_OPERATION_REPORT_FAILED',
      data,
    });
  }
}
