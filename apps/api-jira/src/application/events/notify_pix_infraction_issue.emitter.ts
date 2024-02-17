import { NotifyPixInfractionIssue } from '@zro/api-jira/domain';

export type NotifyPixInfractionIssueEvent = Pick<
  NotifyPixInfractionIssue,
  'state' | 'issueId'
>;

export interface NotifyPixInfractionIssueEventEmitter {
  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue: (event: NotifyPixInfractionIssueEvent) => void;
}
