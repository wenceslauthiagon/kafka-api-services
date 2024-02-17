import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { ReportUserLegalRepresentor } from '@zro/reports/domain';

@Exception(
  ExceptionTypes.SYSTEM,
  'GENERATE_USER_LEGAL_REPRESENTOR_REPORT_FAILED',
)
export class GenerateUserLegalRepresentorReportFailedException extends DefaultException {
  constructor(data: Partial<ReportUserLegalRepresentor>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'GENERATE_USER_LEGAL_REPRESENTOR_REPORT_FAILED',
      data,
    });
  }
}
