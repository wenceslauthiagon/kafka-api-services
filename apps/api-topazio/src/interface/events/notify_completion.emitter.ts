import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-topazio/domain';
import {
  NotifyCompletionEvent,
  NotifyCompletionEventEmitter,
} from '@zro/api-topazio/application';

export enum NotifyCompletionEventType {
  ERROR = 'ERROR',
}

type TNotifyCompletionControllerEvent = NotifyCompletionEvent;

export class NotifyCompletionControllerEvent
  extends AutoValidator
  implements TNotifyCompletionControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  transactionId: string;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyCompletionControllerEvent) {
    super(props);
  }
}

export interface NotifyCompletionEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCompletionEvent: (
    eventName: NotifyCompletionEventType,
    event: NotifyCompletionControllerEvent,
  ) => void;
}

export class NotifyCompletionEventEmitterController
  implements NotifyCompletionEventEmitter
{
  constructor(
    private eventEmitter: NotifyCompletionEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyCompletion(event: NotifyCompletionEvent): void {
    const controllerEvent = new NotifyCompletionControllerEvent({
      id: event.id,
      transactionId: event.transactionId,
      state: event.state,
    });

    this.eventEmitter.emitCompletionEvent(
      NotifyCompletionEventType.ERROR,
      controllerEvent,
    );
  }
}
