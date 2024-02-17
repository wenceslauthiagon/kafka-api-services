import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyPixRefundIssue } from '@zro/api-jira/domain';

@Exception(ExceptionTypes.ADMIN, 'NOTIFY_PIX_REFUND_ISSUE_NOT_FOUND')
export class NotifyPixRefundIssueNotfoundException extends DefaultException {
  constructor(notifyIssue: Partial<NotifyPixRefundIssue>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_PIX_REFUND_ISSUE_NOT_FOUND',
      data: notifyIssue,
    });
  }
}
