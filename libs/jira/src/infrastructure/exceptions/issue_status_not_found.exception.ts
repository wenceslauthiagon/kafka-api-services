import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'ISSUE_STATUS_NOT_FOUND')
export class IssueStatusNotFoundException extends DefaultException {
  constructor(status: string) {
    super({
      message: 'Issue Status Not Found.',
      type: ExceptionTypes.SYSTEM,
      code: 'ISSUE_STATUS_NOT_FOUND',
      data: { status },
    });
  }
}
