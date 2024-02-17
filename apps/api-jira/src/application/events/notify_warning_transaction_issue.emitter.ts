import { NotifyWarningTransactionIssue } from '@zro/api-jira/domain';

export type NotifyWarningTransactionIssueEvent = Pick<
  NotifyWarningTransactionIssue,
  'state' | 'operationId'
>;

export interface NotifyWarningTransactionIssueEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue: (event: NotifyWarningTransactionIssueEvent) => void;
}
