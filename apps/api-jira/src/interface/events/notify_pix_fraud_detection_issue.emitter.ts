import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-jira/domain';
import {
  NotifyPixFraudDetectionIssueEvent,
  NotifyPixFraudDetectionIssueEventEmitter,
} from '@zro/api-jira/application';

export enum NotifyPixFraudDetectionIssueEventType {
  ERROR = 'ERROR',
}

type TNotifyPixFraudDetectionIssueControllerEvent =
  NotifyPixFraudDetectionIssueEvent;

export class NotifyPixFraudDetectionIssueControllerEvent
  extends AutoValidator
  implements TNotifyPixFraudDetectionIssueControllerEvent
{
  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyPixFraudDetectionIssueControllerEvent) {
    super(props);
  }
}

export interface NotifyPixFraudDetectionIssueEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitIssueEvent: (
    eventName: NotifyPixFraudDetectionIssueEventType,
    event: NotifyPixFraudDetectionIssueControllerEvent,
  ) => void;
}

export class NotifyPixFraudDetectionIssueEventEmitterController
  implements NotifyPixFraudDetectionIssueEventEmitter
{
  constructor(
    private eventEmitter: NotifyPixFraudDetectionIssueEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue(event: NotifyPixFraudDetectionIssueEvent): void {
    const controllerEvent = new NotifyPixFraudDetectionIssueControllerEvent({
      issueId: event.issueId,
      state: event.state,
    });

    this.eventEmitter.emitIssueEvent(
      NotifyPixFraudDetectionIssueEventType.ERROR,
      controllerEvent,
    );
  }
}
