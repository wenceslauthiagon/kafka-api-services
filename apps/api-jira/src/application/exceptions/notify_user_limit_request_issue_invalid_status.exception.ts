import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyUserLimitRequestIssue } from '@zro/api-jira/domain';

@Exception(
  ExceptionTypes.ADMIN,
  'NOTIFY_USER_LIMIT_REQUEST_ISSUE_INVALID_STATUS',
)
export class NotifyUserLimitRequestIssueInvalidStatusException extends DefaultException {
  constructor(notifyIssue: Partial<NotifyUserLimitRequestIssue>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_USER_LIMIT_REQUEST_ISSUE_INVALID_STATUS',
      data: notifyIssue,
    });
  }
}
