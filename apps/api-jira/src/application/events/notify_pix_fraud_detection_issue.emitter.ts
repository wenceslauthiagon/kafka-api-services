import { NotifyPixFraudDetectionIssue } from '@zro/api-jira/domain';

export type NotifyPixFraudDetectionIssueEvent = Pick<
  NotifyPixFraudDetectionIssue,
  'state' | 'issueId'
>;

export interface NotifyPixFraudDetectionIssueEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue: (event: NotifyPixFraudDetectionIssueEvent) => void;
}
