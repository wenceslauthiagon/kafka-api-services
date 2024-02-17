import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyPixInfractionIssue } from '@zro/api-jira/domain';

@Exception(ExceptionTypes.ADMIN, 'NOTIFY_PIX_INFRACTION_ISSUE_NOT_FOUND')
export class NotifyPixInfractionIssueNotfoundException extends DefaultException {
  constructor(notifyIssue: Partial<NotifyPixInfractionIssue>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_PIX_INFRACTION_ISSUE_NOT_FOUND',
      data: notifyIssue,
    });
  }
}
