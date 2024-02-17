import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { ReportUser } from '@zro/reports/domain';

@Exception(ExceptionTypes.SYSTEM, 'GENERATE_USER_REPORT_FAILED')
export class GenerateUserReportFailedException extends DefaultException {
  constructor(data: Partial<ReportUser>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'GENERATE_USER_REPORT_FAILED',
      data,
    });
  }
}
