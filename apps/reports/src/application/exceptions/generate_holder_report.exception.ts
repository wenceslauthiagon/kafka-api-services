import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { ReportUser } from '@zro/reports/domain';

@Exception(ExceptionTypes.SYSTEM, 'GENERATE_HOLDER_REPORT_FAILED')
export class GenerateHolderReportFailedException extends DefaultException {
  constructor(data: Partial<ReportUser>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'GENERATE_HOLDER_REPORT_FAILED',
      data,
    });
  }
}
