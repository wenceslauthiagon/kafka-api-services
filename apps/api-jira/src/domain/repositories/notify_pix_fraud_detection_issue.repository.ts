import { NotifyPixFraudDetectionIssue } from '@zro/api-jira/domain';
import { PixFraudDetectionStatus } from '@zro/pix-payments/domain';

export interface NotifyPixFraudDetectionIssueRepository {
  /**
   * Insert a Notify.
   * @param {NotifyPixFraudDetectionIssue} notify Notify to save.
   * @returns {NotifyPixFraudDetectionIssue} Created notify issue.
   */
  create: (
    notifyPixFraudDetectionIssue: NotifyPixFraudDetectionIssue,
  ) => Promise<NotifyPixFraudDetectionIssue>;

  /**
   * Get a Notify by issue id.
   * @param {issueId} issueId issue id to get.
   * @returns {NotifyIssue} Notify issue found.
   */
  getByIssueId: (
    issueId: number,
  ) => Promise<NotifyPixFraudDetectionIssue | null>;

  /**
   * Update a Notify.
   * @param {NotifyPixFraudDetectionIssue} notify Notify to update.
   * @returns {NotifyPixFraudDetectionIssue} Notify updated.
   */
  update: (
    notifyIssue: NotifyPixFraudDetectionIssue,
  ) => Promise<NotifyPixFraudDetectionIssue>;

  /**
   * Get a Notify by issue id and status.
   * @param {issueId} issueId issue id to get.
   * @param {status} PixFraudDetectionStatus status to get.
   * @returns {NotifyIssue} Notify issue found.
   */
  getByIssueIdAndStatus: (
    issueId: number,
    status: PixFraudDetectionStatus,
  ) => Promise<NotifyPixFraudDetectionIssue | null>;
}
