import { NotifyPixRefundIssue } from '@zro/api-jira/domain';
import { PixRefundStatus } from '@zro/pix-payments/domain';

export interface NotifyPixRefundIssueRepository {
  /**
   * Insert a Notify.
   * @param {NotifyPixRefundIssue} notify Notify to save.
   * @returns {NotifyPixRefundIssue} Created notify issue.
   */
  create: (
    notifyPixRefundIssue: NotifyPixRefundIssue,
  ) => Promise<NotifyPixRefundIssue>;

  /**
   * Get a Notify by issue id.
   * @param {issueId} issueId issue id to get.
   * @returns {NotifyIssue} Notify issue found.
   */
  getByIssueId: (issueId: number) => Promise<NotifyPixRefundIssue | null>;

  /**
   * Update a Notify.
   * @param {NotifyPixRefundIssue} notify Notify to update.
   * @returns {NotifyPixRefundIssue} Notify updated.
   */
  update: (notifyIssue: NotifyPixRefundIssue) => Promise<NotifyPixRefundIssue>;

  /**
   * Get a Notify by issue id and status.
   * @param {issueId} issueId issue id to get.
   * @param {status} PixRefundStatus status to get.
   * @returns {NotifyIssue} Notify issue found.
   */
  getByIssueIdAndStatus: (
    issueId: number,
    status: PixRefundStatus,
  ) => Promise<NotifyPixRefundIssue | null>;
}
