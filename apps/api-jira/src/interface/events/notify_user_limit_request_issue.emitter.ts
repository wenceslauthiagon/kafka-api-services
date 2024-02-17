import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { UserLimitRequestNotifyStateType } from '@zro/api-jira/domain';
import {
  NotifyUserLimitRequestIssueEvent,
  NotifyUserLimitRequestIssueEventEmitter,
} from '@zro/api-jira/application';

export enum NotifyUserLimitRequestIssueEventType {
  ERROR = 'ERROR',
}

type TNotifyUserLimitRequestIssueControllerEvent =
  NotifyUserLimitRequestIssueEvent;

export class NotifyUserLimitRequestIssueControllerEvent
  extends AutoValidator
  implements TNotifyUserLimitRequestIssueControllerEvent
{
  @IsUUID(4)
  userLimitRequestId: string;

  @IsEnum(UserLimitRequestNotifyStateType)
  state: UserLimitRequestNotifyStateType;

  constructor(props: TNotifyUserLimitRequestIssueControllerEvent) {
    super(props);
  }
}

export interface NotifyUserLimitRequestIssueEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitIssueEvent: (
    eventName: NotifyUserLimitRequestIssueEventType,
    event: NotifyUserLimitRequestIssueControllerEvent,
  ) => void;
}

export class NotifyUserLimitRequestIssueEventEmitterController
  implements NotifyUserLimitRequestIssueEventEmitter
{
  constructor(
    private eventEmitter: NotifyUserLimitRequestIssueEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue(event: NotifyUserLimitRequestIssueEvent): void {
    const controllerEvent = new NotifyUserLimitRequestIssueControllerEvent({
      userLimitRequestId: event.userLimitRequestId,
      state: event.state,
    });

    this.eventEmitter.emitIssueEvent(
      NotifyUserLimitRequestIssueEventType.ERROR,
      controllerEvent,
    );
  }
}
