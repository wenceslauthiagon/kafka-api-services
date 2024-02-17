import { NotifyUserWithdrawSettingRequestIssue } from '@zro/api-jira/domain';
import { UserWithdrawSettingRequestState } from '@zro/compliance/domain';

export interface NotifyUserWithdrawSettingRequestIssueRepository {
  /**
   * Insert a Notify.
   * @param notifyUserWithdrawSettingRequestIssue notify Notify to save.
   * @returns NotifyUserWithdrawSettingRequestIssue Created notify issue.
   */
  create: (
    notifyUserWithdrawSettingRequestIssue: NotifyUserWithdrawSettingRequestIssue,
  ) => Promise<NotifyUserWithdrawSettingRequestIssue>;

  /**
   * Get a Notify by issue id and status.
   * @param issueId issue id to get.
   * @param status UserWithdrawSettingRequestStatus status to get.
   * @returns NotifyIssue Notify issue found.
   */
  getByIssueIdAndStatus: (
    issueId: string,
    status: UserWithdrawSettingRequestState,
  ) => Promise<NotifyUserWithdrawSettingRequestIssue | null>;
}
