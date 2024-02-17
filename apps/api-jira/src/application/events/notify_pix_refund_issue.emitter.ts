import { NotifyPixRefundIssue } from '@zro/api-jira/domain';

export type NotifyPixRefundIssueEvent = Pick<
  NotifyPixRefundIssue,
  'state' | 'issueId'
>;

export interface NotifyPixRefundIssueEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue: (event: NotifyPixRefundIssueEvent) => void;
}
