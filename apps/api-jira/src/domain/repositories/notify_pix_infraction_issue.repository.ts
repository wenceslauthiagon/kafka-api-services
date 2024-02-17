import { NotifyPixInfractionIssue } from '@zro/api-jira/domain';
import { PixInfractionStatus } from '@zro/pix-payments/domain';

export interface NotifyPixInfractionIssueRepository {
  /**
   * Insert a Notify.
   * @param {NotifyPixInfractionIssue} notify Notify to save.
   * @returns {NotifyPixInfractionIssue} Created notify issue.
   */
  create: (
    notifyPixInfractionIssue: NotifyPixInfractionIssue,
  ) => Promise<NotifyPixInfractionIssue>;

  /**
   * Get a Notify by issue id.
   * @param {issueId} issueId issue id to get.
   * @returns {NotifyIssue} Notify issue found.
   */
  getByIssueId: (issueId: number) => Promise<NotifyPixInfractionIssue | null>;

  /**
   * Update a Notify.
   * @param {NotifyPixInfractionIssue} notify Notify to update.
   * @returns {NotifyPixInfractionIssue} Notify updated.
   */
  update: (
    notifyIssue: NotifyPixInfractionIssue,
  ) => Promise<NotifyPixInfractionIssue>;

  /**
   * Get a Notify by issue id and status.
   * @param {issueId} issueId issue id to get.
   * @param {status} PixInfractionStatus status to get.
   * @returns {NotifyIssue} Notify issue found.
   */
  getByIssueIdAndStatus: (
    issueId: number,
    status: PixInfractionStatus,
  ) => Promise<NotifyPixInfractionIssue | null>;
}
