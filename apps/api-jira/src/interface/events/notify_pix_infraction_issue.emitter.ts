import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-jira/domain';
import {
  NotifyPixInfractionIssueEvent,
  NotifyPixInfractionIssueEventEmitter,
} from '@zro/api-jira/application';

export enum NotifyPixInfractionIssueEventType {
  ERROR = 'ERROR',
}

type TNotifyPixInfractionIssueControllerEvent = NotifyPixInfractionIssueEvent;

export class NotifyPixInfractionIssueControllerEvent
  extends AutoValidator
  implements TNotifyPixInfractionIssueControllerEvent
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyPixInfractionIssueControllerEvent) {
    super(props);
  }
}

export interface NotifyPixInfractionIssueEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitIssueEvent: (
    eventName: NotifyPixInfractionIssueEventType,
    event: NotifyPixInfractionIssueControllerEvent,
  ) => void;
}

export class NotifyPixInfractionIssueEventEmitterController
  implements NotifyPixInfractionIssueEventEmitter
{
  constructor(
    private eventEmitter: NotifyPixInfractionIssueEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue(event: NotifyPixInfractionIssueEvent): void {
    const controllerEvent = new NotifyPixInfractionIssueControllerEvent({
      issueId: event.issueId,
      state: event.state,
    });

    this.eventEmitter.emitIssueEvent(
      NotifyPixInfractionIssueEventType.ERROR,
      controllerEvent,
    );
  }
}
