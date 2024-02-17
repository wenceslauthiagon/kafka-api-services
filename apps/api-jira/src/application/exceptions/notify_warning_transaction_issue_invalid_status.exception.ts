import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyWarningTransactionIssue } from '@zro/api-jira/domain';

@Exception(
  ExceptionTypes.ADMIN,
  'NOTIFY_WARNING_TRANSACTION_ISSUE_INVALID_STATUS',
)
export class NotifyWarningTransactionIssueInvalidStatusException extends DefaultException {
  constructor(notifyIssue: Partial<NotifyWarningTransactionIssue>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_WARNING_TRANSACTION_ISSUE_INVALID_STATUS',
      data: notifyIssue,
    });
  }
}
