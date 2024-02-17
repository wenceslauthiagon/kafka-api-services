import { NotifyWarningTransactionIssue } from '@zro/api-jira/domain';
import { WarningTransactionStatus } from '@zro/compliance/domain';

export interface NotifyWarningTransactionIssueRepository {
  /**
   * Insert a Notify.
   * @param {NotifyWarningTransactionIssue} notify Notify to save.
   * @returns {NotifyWarningTransactionIssue} Created notify issue.
   */
  create: (
    notifyWarningTransactionIssue: NotifyWarningTransactionIssue,
  ) => Promise<NotifyWarningTransactionIssue>;

  /**
   * Get a Notify by issue id and status.
   * @param {issueId} issueId issue id to get.
   * @param {status} WarningTransactionStatus status to get.
   * @returns {NotifyIssue} Notify issue found.
   */
  getByIssueIdAndStatus: (
    issueId: number,
    status: WarningTransactionStatus,
  ) => Promise<NotifyWarningTransactionIssue | null>;
}
