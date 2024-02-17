import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-jira/domain';
import {
  NotifyPixRefundIssueEvent,
  NotifyPixRefundIssueEventEmitter,
} from '@zro/api-jira/application';

export enum NotifyPixRefundIssueEventType {
  ERROR = 'ERROR',
}

type TNotifyPixRefundIssueControllerEvent = NotifyPixRefundIssueEvent;

export class NotifyPixRefundIssueControllerEvent
  extends AutoValidator
  implements TNotifyPixRefundIssueControllerEvent
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyPixRefundIssueControllerEvent) {
    super(props);
  }
}

export interface NotifyPixRefundIssueEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitIssueEvent: (
    eventName: NotifyPixRefundIssueEventType,
    event: NotifyPixRefundIssueControllerEvent,
  ) => void;
}

export class NotifyPixRefundIssueEventEmitterController
  implements NotifyPixRefundIssueEventEmitter
{
  constructor(
    private eventEmitter: NotifyPixRefundIssueEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue(event: NotifyPixRefundIssueEvent): void {
    const controllerEvent = new NotifyPixRefundIssueControllerEvent({
      issueId: event.issueId,
      state: event.state,
    });

    this.eventEmitter.emitIssueEvent(
      NotifyPixRefundIssueEventType.ERROR,
      controllerEvent,
    );
  }
}
