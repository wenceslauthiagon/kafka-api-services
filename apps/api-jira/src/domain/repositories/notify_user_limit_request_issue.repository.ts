import { NotifyUserLimitRequestIssue } from '@zro/api-jira/domain';

export interface NotifyUserLimitRequestIssueRepository {
  /**
   * Insert a Notify.
   * @param {NotifyUserLimitRequestIssue} notify Notify to save.
   * @returns {NotifyUserLimitRequestIssue} Created notify issue.
   */
  create: (
    notifyUserLimitRequestIssue: NotifyUserLimitRequestIssue,
  ) => Promise<NotifyUserLimitRequestIssue>;
}
