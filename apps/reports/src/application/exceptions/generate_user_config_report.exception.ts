import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { ReportUserConfig } from '@zro/reports/domain';

@Exception(ExceptionTypes.SYSTEM, 'GENERATE_USER_CONFIG_REPORT_FAILED')
export class GenerateUserConfigReportFailedException extends DefaultException {
  constructor(data: Partial<ReportUserConfig>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'GENERATE_USER_CONFIG_REPORT_FAILED',
      data,
    });
  }
}
