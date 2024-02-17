import { NotifyUserLimitRequestIssue } from '@zro/api-jira/domain';

export type NotifyUserLimitRequestIssueEvent = Pick<
  NotifyUserLimitRequestIssue,
  'state' | 'userLimitRequestId'
>;

export interface NotifyUserLimitRequestIssueEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue: (event: NotifyUserLimitRequestIssueEvent) => void;
}
