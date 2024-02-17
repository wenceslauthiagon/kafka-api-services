import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyPixFraudDetectionIssue } from '@zro/api-jira/domain';

@Exception(
  ExceptionTypes.ADMIN,
  'NOTIFY_PIX_FRAUD_DETECTION_ISSUE_INVALID_STATUS',
)
export class NotifyPixFraudDetectionIssueInvalidStatusException extends DefaultException {
  constructor(notifyIssue: Partial<NotifyPixFraudDetectionIssue>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_PIX_FRAUD_DETECTION_ISSUE_INVALID_STATUS',
      data: notifyIssue,
    });
  }
}
