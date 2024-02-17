import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyPixInfractionIssue } from '@zro/api-jira/domain';

@Exception(ExceptionTypes.ADMIN, 'NOTIFY_PIX_INFRACTION_ISSUE_INVALID_STATE')
export class NotifyPixInfractionIssueInvalidStateException extends DefaultException {
  constructor(notifyIssue: Partial<NotifyPixInfractionIssue>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'NOTIFY_PIX_INFRACTION_ISSUE_INVALID_STATE',
      data: notifyIssue,
    });
  }
}
