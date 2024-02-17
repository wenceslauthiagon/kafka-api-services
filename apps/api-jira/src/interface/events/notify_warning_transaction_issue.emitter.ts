import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-topazio/domain';
import {
  NotifyWarningTransactionIssueEvent,
  NotifyWarningTransactionIssueEventEmitter,
} from '@zro/api-jira/application';

export enum NotifyWarningTransactionIssueEventType {
  ERROR = 'ERROR',
}

type TNotifyWarningTransactionIssueControllerEvent =
  NotifyWarningTransactionIssueEvent;

export class NotifyWarningTransactionIssueControllerEvent
  extends AutoValidator
  implements TNotifyWarningTransactionIssueControllerEvent
{
  @IsUUID(4)
  operationId: string;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyWarningTransactionIssueControllerEvent) {
    super(props);
  }
}

export interface NotifyWarningTransactionIssueEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitIssueEvent: (
    eventName: NotifyWarningTransactionIssueEventType,
    event: NotifyWarningTransactionIssueControllerEvent,
  ) => void;
}

export class NotifyWarningTransactionIssueEventEmitterController
  implements NotifyWarningTransactionIssueEventEmitter
{
  constructor(
    private eventEmitter: NotifyWarningTransactionIssueEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyIssue(event: NotifyWarningTransactionIssueEvent): void {
    const controllerEvent = new NotifyWarningTransactionIssueControllerEvent({
      operationId: event.operationId,
      state: event.state,
    });

    this.eventEmitter.emitIssueEvent(
      NotifyWarningTransactionIssueEventType.ERROR,
      controllerEvent,
    );
  }
}
