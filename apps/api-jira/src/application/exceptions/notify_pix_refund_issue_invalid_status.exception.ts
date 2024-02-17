import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyPixRefundIssue } from '@zro/api-jira/domain';

@Exception(ExceptionTypes.ADMIN, 'NOTIFY_PIX_REFUND_ISSUE_INVALID_STATUS')
export class NotifyPixRefundIssueInvalidStatusException extends DefaultException {
  constructor(notifyIssue: Partial<NotifyPixRefundIssue>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_PIX_REFUND_ISSUE_INVALID_STATUS',
      data: notifyIssue,
    });
  }
}
