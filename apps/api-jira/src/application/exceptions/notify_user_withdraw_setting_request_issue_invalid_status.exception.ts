import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { NotifyUserWithdrawSettingRequestIssue } from '@zro/api-jira/domain';

@Exception(
  ExceptionTypes.ADMIN,
  'NOTIFY_USER_WITHDRAW_SETTING_REQUEST_ISSUE_INVALID_STATUS',
)
export class NotifyUserWithdrawSettingRequestIssueInvalidStatusException extends DefaultException {
  constructor(notifyIssue: Partial<NotifyUserWithdrawSettingRequestIssue>) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_USER_WITHDRAW_SETTING_REQUEST_ISSUE_INVALID_STATUS',
      data: notifyIssue,
    });
  }
}
